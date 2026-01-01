import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define database schema
interface FinoraDB extends DBSchema {
    users: {
        key: string;
        value: {
            id: string;
            email: string;
            name: string;
            baseCurrency: string;
            avatar?: string;
            createdAt: string;
        };
        indexes: { 'by-email': string };
    };
    income_sources: {
        key: string;
        value: {
            id: string;
            userId: string;
            sourceName: string;
            amount: number;
            recurrence: 'once' | 'weekly' | 'monthly' | 'yearly';
            isActive: boolean;
            startDate?: string;
            endDate?: string;
            createdAt: string;
        };
        indexes: { 'by-user': string };
    };
    expenses: {
        key: string;
        value: {
            id: string;
            userId: string;
            category: string;
            amount: number;
            description?: string;
            expenseDate: string;
            isRecurring: boolean;
            recurrenceType?: 'once' | 'weekly' | 'monthly' | 'yearly';
            createdAt: string;
        };
        indexes: { 'by-user': string; 'by-date': string };
    };
    savings: {
        key: string;
        value: {
            id: string;
            userId: string;
            amount: number;
            type: 'manual' | 'automatic';
            percentage?: number;
            savingDate: string;
            notes?: string;
            createdAt: string;
        };
        indexes: { 'by-user': string };
    };
    investments: {
        key: string;
        value: {
            id: string;
            userId: string;
            assetName: string;
            assetType: 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'other';
            initialAmount: number;
            currentValue: number;
            purchaseDate: string;
            closeDate?: string;
            status: 'active' | 'closed';
            notes?: string;
            createdAt: string;
        };
        indexes: { 'by-user': string; 'by-status': string };
    };
    notifications: {
        key: string;
        value: {
            id: string;
            userId: string;
            type: 'income' | 'expense' | 'saving' | 'investment' | 'system';
            category?: string;
            title: string;
            message: string;
            isRead: boolean;
            createdAt: string;
        };
        indexes: { 'by-user': string; 'by-read': number };
    };
    sync_queue: {
        key: string;
        value: {
            id: string;
            operation: 'create' | 'update' | 'delete';
            entity: string;
            data: any;
            timestamp: string;
        };
    };
}

let dbInstance: IDBPDatabase<FinoraDB> | null = null;

// Initialize IndexedDB
export async function initializeIndexedDB(): Promise<IDBPDatabase<FinoraDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<FinoraDB>('finora-db', 2, {
        upgrade(db) {
            // Users store
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'id' });
                userStore.createIndex('by-email', 'email', { unique: true });
            }

            // Income sources store
            if (!db.objectStoreNames.contains('income_sources')) {
                const incomeStore = db.createObjectStore('income_sources', { keyPath: 'id' });
                incomeStore.createIndex('by-user', 'userId');
            }

            // Expenses store
            if (!db.objectStoreNames.contains('expenses')) {
                const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expenseStore.createIndex('by-user', 'userId');
                expenseStore.createIndex('by-date', 'expenseDate');
            }

            // Savings store
            if (!db.objectStoreNames.contains('savings')) {
                const savingsStore = db.createObjectStore('savings', { keyPath: 'id' });
                savingsStore.createIndex('by-user', 'userId');
            }

            // Investments store
            if (!db.objectStoreNames.contains('investments')) {
                const investmentStore = db.createObjectStore('investments', { keyPath: 'id' });
                investmentStore.createIndex('by-user', 'userId');
                investmentStore.createIndex('by-status', 'status');
            }

            // Notifications store
            if (!db.objectStoreNames.contains('notifications')) {
                const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
                notificationStore.createIndex('by-user', 'userId');
                notificationStore.createIndex('by-read', 'isRead');
            }

            // Sync queue for offline operations
            if (!db.objectStoreNames.contains('sync_queue')) {
                db.createObjectStore('sync_queue', { keyPath: 'id' });
            }
        },
    });

    console.log('✅ IndexedDB initialized successfully');
    return dbInstance;
}

// Get database instance
export async function getDB(): Promise<IDBPDatabase<FinoraDB>> {
    if (!dbInstance) {
        return await initializeIndexedDB();
    }
    return dbInstance;
}

// Generic CRUD operations
export const IndexedDBService = {
    // Create
    async create<T extends keyof FinoraDB>(storeName: T, data: FinoraDB[T]['value']): Promise<void> {
        const db = await getDB();
        await db.add(storeName as any, data as any);
    },

    // Read one
    async getById<T extends keyof FinoraDB>(storeName: T, id: string): Promise<FinoraDB[T]['value'] | undefined> {
        const db = await getDB();
        return await db.get(storeName as any, id);
    },

    // Read all
    async getAll<T extends keyof FinoraDB>(storeName: T): Promise<FinoraDB[T]['value'][]> {
        const db = await getDB();
        return await db.getAll(storeName as any);
    },

    // Read by index
    async getAllByIndex<T extends keyof FinoraDB>(
        storeName: T,
        indexName: string,
        query: any
    ): Promise<FinoraDB[T]['value'][]> {
        const db = await getDB();
        return await db.getAllFromIndex(storeName as any, indexName as any, query);
    },

    // Update
    async update<T extends keyof FinoraDB>(storeName: T, data: FinoraDB[T]['value']): Promise<void> {
        const db = await getDB();
        await db.put(storeName as any, data as any);
    },

    // Delete
    async delete<T extends keyof FinoraDB>(storeName: T, id: string): Promise<void> {
        const db = await getDB();
        await db.delete(storeName as any, id);
    },

    // Clear store
    async clear<T extends keyof FinoraDB>(storeName: T): Promise<void> {
        const db = await getDB();
        await db.clear(storeName as any);
    },

    // Add to sync queue
    async addToSyncQueue(operation: 'create' | 'update' | 'delete', entity: string, data: any): Promise<void> {
        const db = await getDB();
        await db.add('sync_queue', {
            id: `${Date.now()}-${Math.random()}`,
            operation,
            entity,
            data,
            timestamp: new Date().toISOString(),
        });
    },

    // Get sync queue
    async getSyncQueue(): Promise<any[]> {
        const db = await getDB();
        return await db.getAll('sync_queue');
    },

    // Delete item from sync queue
    async deleteFromSyncQueue(id: string): Promise<void> {
        const db = await getDB();
        await db.delete('sync_queue', id);
    },

    // Clear sync queue
    async clearSyncQueue(): Promise<void> {
        const db = await getDB();
        await db.clear('sync_queue');
    },
};

export default IndexedDBService;
