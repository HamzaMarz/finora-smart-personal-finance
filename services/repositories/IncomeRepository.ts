
import api from '../api';
import IndexedDBService from '../../database/indexeddb';
import { Income } from '../../types/income';
import { v4 as uuidv4 } from 'uuid';

export const IncomeRepository = {
    async getAll(): Promise<Income[]> {
        if (navigator.onLine) {
            try {
                const response = await api.get('/income');
                const data = response.data;

                // Handle sync between server data and local pending data
                const queue = await IndexedDBService.getSyncQueue();
                const pendingIds = queue
                    .filter(q => q.entity === 'income')
                    .map(q => q.data.id);

                const allLocal = await IndexedDBService.getAll('income_sources');

                // Remove items from local that are not pending and not in the new server list
                // To avoid stale data, we first remove non-pending local items
                for (const localItem of allLocal) {
                    if (!pendingIds.includes(localItem.id)) {
                        await IndexedDBService.delete('income_sources', localItem.id);
                    }
                }

                // Add/Update with fresh server data
                for (const serverItem of data) {
                    await IndexedDBService.update('income_sources', serverItem);
                }

                // Merge server data with pending local changes
                // Actually getting all from DB after update is easiest + Pending items are preserved
                const updatedLocal = await IndexedDBService.getAll('income_sources');
                return updatedLocal as unknown as Income[];

            } catch (err) {
                console.warn('Network error in getAll, falling back to offline', err);
            }
        }

        const localData = await IndexedDBService.getAll('income_sources');
        return localData as unknown as Income[];
    },

    async create(income: Partial<Income>): Promise<void> {
        const tempId = uuidv4();
        // Ensure we have all required fields for DB
        const newIncome = {
            ...income,
            id: tempId,
            isActive: true,
            createdAt: new Date().toISOString(),
            recurrence: income.recurrence || 'monthly',
        };

        if (navigator.onLine) {
            try {
                // Remove id for server creation as server generates it
                const { id, ...payload } = newIncome;
                const response = await api.post('/income', payload);
                // Save the Real ID version
                await IndexedDBService.update('income_sources', response.data);
                return;
            } catch (err) {
                console.warn('Create failed online, trying offline', err);
            }
        }

        // Offline or fallback
        await IndexedDBService.update('income_sources', newIncome as any);
        await IndexedDBService.addToSyncQueue('create', 'income', newIncome);
    },

    async update(id: string, income: Partial<Income>): Promise<void> {
        if (navigator.onLine) {
            try {
                await api.put(`/income/${id}`, income);
                // Update local DB
                const existing = await IndexedDBService.getById('income_sources', id);
                if (existing) {
                    await IndexedDBService.update('income_sources', { ...existing, ...income } as any);
                }
                return;
            } catch (err) {
                console.warn('Update failed online, trying offline', err);
            }
        }

        // Offline
        const existing = await IndexedDBService.getById('income_sources', id);
        if (existing) {
            const updated = { ...existing, ...income };
            await IndexedDBService.update('income_sources', updated as any);
            await IndexedDBService.addToSyncQueue('update', 'income', updated);
        }
    },

    async delete(id: string): Promise<void> {
        if (navigator.onLine) {
            try {
                await api.delete(`/income/${id}`);
                await IndexedDBService.delete('income_sources', id);
                return;
            } catch (err) {
                console.warn('Delete failed online, trying offline', err);
            }
        }

        // Offline
        const queue = await IndexedDBService.getSyncQueue();
        const pendingCreation = queue.find(q => q.entity === 'income' && q.operation === 'create' && q.data.id === id);

        if (pendingCreation) {
            // If we are deleting an item that hasn't been synced yet, just remove it from queue and DB
            await IndexedDBService.deleteFromSyncQueue(pendingCreation.id);
            await IndexedDBService.delete('income_sources', id);
        } else {
            // Real item or pending update - queue deletion
            await IndexedDBService.delete('income_sources', id);
            await IndexedDBService.addToSyncQueue('delete', 'income', { id });
        }
    }
};
