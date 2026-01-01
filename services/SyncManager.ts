
import IndexedDBService from '../database/indexeddb';
import api from './api';
import toast from 'react-hot-toast';

const SYNC_CONFIG: Record<string, { endpoint: string, storeName: any }> = {
    income: { endpoint: '/income', storeName: 'income_sources' },
    expenses: { endpoint: '/expenses', storeName: 'expenses' },
    savings: { endpoint: '/savings', storeName: 'savings' },
    investments: { endpoint: '/investments', storeName: 'investments' },
};

class SyncManager {
    private isSyncing = false;

    async sync() {
        if (!navigator.onLine || this.isSyncing) return;

        try {
            const queue = await IndexedDBService.getSyncQueue();
            if (queue.length === 0) return;

            this.isSyncing = true;
            const toastId = toast.loading('Syncing offline changes...');
            let successCount = 0;

            for (const item of queue) {
                const config = SYNC_CONFIG[item.entity];
                if (!config) {
                    console.error(`Unknown entity type for sync: ${item.entity}`);
                    continue;
                }

                try {
                    let success = false;

                    if (item.operation === 'create') {
                        const { id, ...payload } = item.data;

                        const response = await api.post(config.endpoint, payload);

                        // Swap ID in local DB
                        const realData = response.data;

                        // Delete the temporary item
                        await IndexedDBService.delete(config.storeName, item.data.id);
                        // Add the confirmed item from server
                        await IndexedDBService.update(config.storeName, realData);

                        success = true;

                    } else if (item.operation === 'update') {
                        const { id, ...payload } = item.data;
                        await api.put(`${config.endpoint}/${id}`, payload);
                        await IndexedDBService.update(config.storeName, item.data);
                        success = true;

                    } else if (item.operation === 'delete') {
                        await api.delete(`${config.endpoint}/${item.data.id}`);
                        await IndexedDBService.delete(config.storeName, item.data.id);
                        success = true;
                    }

                    if (success) {
                        // Remove from queue: item.id is the queue item's ID
                        await IndexedDBService.deleteFromSyncQueue(item.id);
                        successCount++;
                    }

                } catch (error: any) {
                    console.error(`Failed to sync item ${item.id}`, error);
                    // If 400 or 404, we might want to discard it?
                }
            }

            if (successCount > 0) {
                toast.success('Sync complete', { id: toastId });
                window.dispatchEvent(new Event('finora-synced'));
            } else {
                toast.dismiss(toastId);
            }

        } catch (err) {
            console.error('Sync process failed', err);
        } finally {
            this.isSyncing = false;
        }
    }

    init() {
        window.addEventListener('online', () => {
            console.log('Online detected, trying to sync...');
            this.sync();
        });

        if (navigator.onLine) {
            this.sync();
        }
    }
}

export const syncManager = new SyncManager();
