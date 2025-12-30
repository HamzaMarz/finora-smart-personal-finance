import db from '../database/sqlite.ts';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

interface User {
    id: string;
    email: string;
    name: string;
    passwordHash?: string;
    baseCurrency: string;
    language: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    savingsPercentage?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface IncomeSource {
    id: string;
    userId: string;
    sourceName: string;
    amount: number;
    recurrence: 'once' | 'weekly' | 'monthly' | 'yearly';
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

interface Expense {
    id: string;
    userId: string;
    category: string;
    amount: number;
    currency: string;
    description?: string;
    expenseDate: string;
    isRecurring: boolean;
    recurrenceType?: 'once' | 'weekly' | 'monthly' | 'yearly';
}

interface Saving {
    id: string;
    userId: string;
    amount: number;
    type: 'manual' | 'automatic';
    percentage?: number;
    savingDate: string;
    notes?: string;
}

interface Investment {
    id: string;
    userId: string;
    assetName: string;
    assetType: 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'forex' | 'manual' | 'other';
    symbol?: string;
    quantity: number;
    buyPrice: number;
    initialAmount: number; // initialAmount = buyPrice * quantity
    currentValue: number;
    sellPrice?: number;
    currency: string;
    purchaseDate: string;
    closeDate?: string;
    status: 'active' | 'closed';
    notes?: string;
}

interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'income' | 'expense' | 'saving' | 'investment' | 'system';
    category: 'budget' | 'income' | 'expense' | 'savings' | 'investment' | 'system' | 'alert';
    isRead: boolean;
    createdAt: string;
}

interface ExchangeRate {
    currencyCode: string;
    rate: number;
    lastUpdated: string;
    isManual: boolean;
}

// Storage abstraction layer that works with both SQLite (backend) and IndexedDB (frontend)
export const StorageService = {
    // ==================== USERS ====================
    users: {
        create: async (data: Omit<User, 'id'>): Promise<User> => {
            const id = uuidv4();
            const stmt = db.prepare(`
        INSERT INTO users (id, email, name, password_hash, base_currency, language, avatar, phone, bio, savings_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(
                id,
                data.email,
                data.name,
                data.passwordHash || null,
                data.baseCurrency || 'USD',
                data.language || 'en',
                data.avatar || null,
                data.phone || null,
                data.bio || null,
                data.savingsPercentage || 0
            );
            const now = new Date().toISOString();
            return { id, ...data, createdAt: now, updatedAt: now };
        },

        findByEmail: async (email: string): Promise<User | null> => {
            const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
            const row = stmt.get(email) as any;
            if (!row) return null;
            return {
                id: row.id,
                email: row.email,
                name: row.name,
                passwordHash: row.password_hash,
                baseCurrency: row.base_currency,
                language: row.language,
                avatar: row.avatar,
                savingsPercentage: row.savings_percentage || 0,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        },

        findById: async (id: string): Promise<User | null> => {
            const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
            const row = stmt.get(id) as any;
            if (!row) return null;
            return {
                id: row.id,
                email: row.email,
                name: row.name,
                passwordHash: row.password_hash,
                baseCurrency: row.base_currency,
                language: row.language,
                avatar: row.avatar,
                savingsPercentage: row.savings_percentage || 0,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        },

        update: async (id: string, data: Partial<User>): Promise<void> => {
            const fields: string[] = [];
            const values: any[] = [];

            console.log(`📡 StorageService: Updating user ${id} with data:`, data);

            try {
                if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
                if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
                // Use BOTH names for compatibility during transition
                if (data.baseCurrency !== undefined) { fields.push('base_currency = ?'); values.push(data.baseCurrency); }
                else if ((data as any).base_currency !== undefined) { fields.push('base_currency = ?'); values.push((data as any).base_currency); }

                if (data.language !== undefined) { fields.push('language = ?'); values.push(data.language); }
                if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
                if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
                if (data.bio !== undefined) { fields.push('bio = ?'); values.push(data.bio); }
                if (data.passwordHash !== undefined) { fields.push('password_hash = ?'); values.push(data.passwordHash); }
                if (data.savingsPercentage !== undefined) { fields.push('savings_percentage = ?'); values.push(data.savingsPercentage); }

                if (fields.length === 0) {
                    console.log('⚠ StorageService: No fields to update.');
                    return;
                }

                values.push(id);
                const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                console.log('📡 Executing query:', query, 'with values:', values);

                const stmt = db.prepare(query);
                stmt.run(...values);
                console.log('✅ StorageService: User update successful');
            } catch (error: any) {
                console.error('❌ StorageService: Failed to update user:', error.message);
                throw error;
            }
        },
    },

    // ==================== INCOME ====================
    income: {
        create: async (data: Omit<IncomeSource, 'id'>): Promise<IncomeSource> => {
            const id = uuidv4();
            const stmt = db.prepare(`
        INSERT INTO income_sources (id, user_id, source_name, amount, recurrence, is_active, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(
                id,
                data.userId,
                data.sourceName,
                data.amount,
                data.recurrence,
                data.isActive ? 1 : 0,
                data.startDate || null,
                data.endDate || null
            );
            return { id, ...data };
        },

        findByUser: async (userId: string): Promise<IncomeSource[]> => {
            const stmt = db.prepare('SELECT * FROM income_sources WHERE user_id = ? ORDER BY created_at DESC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                sourceName: row.source_name,
                amount: row.amount,
                recurrence: row.recurrence,
                isActive: Boolean(row.is_active),
                startDate: row.start_date,
                endDate: row.end_date,
            }));
        },

        update: async (id: string, data: Partial<IncomeSource>): Promise<void> => {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.sourceName) { fields.push('source_name = ?'); values.push(data.sourceName); }
            if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
            if (data.recurrence) { fields.push('recurrence = ?'); values.push(data.recurrence); }
            if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
            if (data.startDate) { fields.push('start_date = ?'); values.push(data.startDate); }
            if (data.endDate) { fields.push('end_date = ?'); values.push(data.endDate); }

            if (fields.length === 0) return;

            values.push(id);
            const stmt = db.prepare(`UPDATE income_sources SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.run(...values);
        },

        delete: async (id: string): Promise<void> => {
            const stmt = db.prepare('DELETE FROM income_sources WHERE id = ?');
            stmt.run(id);
        },
    },

    // ==================== EXPENSES ====================
    expenses: {
        create: async (data: Omit<Expense, 'id'>): Promise<Expense> => {
            const id = uuidv4();
            const stmt = db.prepare(`
        INSERT INTO expenses (id, user_id, category, amount, currency, description, expense_date, is_recurring, recurrence_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(
                id,
                data.userId,
                data.category,
                data.amount,
                data.currency || 'USD',
                data.description || null,
                data.expenseDate,
                data.isRecurring ? 1 : 0,
                data.recurrenceType || null
            );
            return { id, ...data };
        },

        findByUser: async (userId: string): Promise<Expense[]> => {
            const stmt = db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                category: row.category,
                amount: row.amount,
                currency: row.currency,
                description: row.description,
                expenseDate: row.expense_date,
                isRecurring: Boolean(row.is_recurring),
                recurrenceType: row.recurrence_type,
            }));
        },

        update: async (id: string, data: Partial<Expense>): Promise<void> => {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.category) { fields.push('category = ?'); values.push(data.category); }
            if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
            if (data.currency) { fields.push('currency = ?'); values.push(data.currency); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            if (data.expenseDate) { fields.push('expense_date = ?'); values.push(data.expenseDate); }
            if (data.isRecurring !== undefined) { fields.push('is_recurring = ?'); values.push(data.isRecurring ? 1 : 0); }
            if (data.recurrenceType) { fields.push('recurrence_type = ?'); values.push(data.recurrenceType); }

            if (fields.length === 0) return;

            values.push(id);
            const stmt = db.prepare(`UPDATE expenses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.run(...values);
        },

        delete: async (id: string): Promise<void> => {
            const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
            stmt.run(id);
        },
    },

    // ==================== SAVINGS ====================
    savings: {
        create: async (data: Omit<Saving, 'id'>): Promise<Saving> => {
            const id = uuidv4();
            const stmt = db.prepare(`
        INSERT INTO savings (id, user_id, amount, type, percentage, saving_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(
                id,
                data.userId,
                data.amount,
                data.type,
                data.percentage || null,
                data.savingDate,
                data.notes || null
            );
            return { id, ...data };
        },

        findByUser: async (userId: string): Promise<Saving[]> => {
            const stmt = db.prepare('SELECT * FROM savings WHERE user_id = ? ORDER BY saving_date DESC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                amount: row.amount,
                type: row.type,
                percentage: row.percentage,
                savingDate: row.saving_date,
                notes: row.notes,
            }));
        },

        update: async (id: string, data: Partial<Saving>): Promise<void> => {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
            if (data.type) { fields.push('type = ?'); values.push(data.type); }
            if (data.percentage !== undefined) { fields.push('percentage = ?'); values.push(data.percentage); }
            if (data.savingDate) { fields.push('saving_date = ?'); values.push(data.savingDate); }
            if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

            if (fields.length === 0) return;

            values.push(id);
            const stmt = db.prepare(`UPDATE savings SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.run(...values);
        },

        delete: async (id: string): Promise<void> => {
            const stmt = db.prepare('DELETE FROM savings WHERE id = ?');
            stmt.run(id);
        },
    },

    // ==================== INVESTMENTS ====================
    investments: {
        create: async (data: Omit<Investment, 'id'>): Promise<Investment> => {
            const id = uuidv4();
            const stmt = db.prepare(`
        INSERT INTO investments (id, user_id, asset_name, asset_type, symbol, quantity, buy_price, initial_amount, current_value, currency, purchase_date, close_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(
                id,
                data.userId,
                data.assetName,
                data.assetType,
                data.symbol || null,
                data.quantity || 1,
                data.buyPrice || 0,
                data.initialAmount,
                data.currentValue,
                data.currency || 'USD',
                data.purchaseDate,
                data.closeDate || null,
                data.status,
                data.notes || null
            );
            return { id, ...data };
        },

        findByUser: async (userId: string): Promise<Investment[]> => {
            const stmt = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY purchase_date DESC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                assetName: row.asset_name,
                assetType: row.asset_type,
                symbol: row.symbol,
                quantity: row.quantity,
                buyPrice: row.buy_price,
                initialAmount: row.initial_amount,
                currentValue: row.current_value,
                currency: row.currency,
                purchaseDate: row.purchase_date,
                closeDate: row.close_date,
                status: row.status,
                notes: row.notes,
            }));
        },

        update: async (id: string, data: Partial<Investment>): Promise<void> => {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.assetName) { fields.push('asset_name = ?'); values.push(data.assetName); }
            if (data.assetType) { fields.push('asset_type = ?'); values.push(data.assetType); }
            if (data.symbol !== undefined) { fields.push('symbol = ?'); values.push(data.symbol); }
            if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
            if (data.buyPrice !== undefined) { fields.push('buy_price = ?'); values.push(data.buyPrice); }
            if (data.initialAmount !== undefined) { fields.push('initial_amount = ?'); values.push(data.initialAmount); }
            if (data.currentValue !== undefined) { fields.push('current_value = ?'); values.push(data.currentValue); }
            if (data.sellPrice !== undefined) { fields.push('sell_price = ?'); values.push(data.sellPrice); }
            if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
            if (data.purchaseDate) { fields.push('purchase_date = ?'); values.push(data.purchaseDate); }
            if (data.closeDate !== undefined) { fields.push('close_date = ?'); values.push(data.closeDate); }
            if (data.status) { fields.push('status = ?'); values.push(data.status); }
            if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

            if (fields.length === 0) return;

            values.push(id);
            const stmt = db.prepare(`UPDATE investments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.run(...values);
        },

        delete: async (id: string): Promise<void> => {
            const stmt = db.prepare('DELETE FROM investments WHERE id = ?');
            stmt.run(id);
        },
    },

    // ==================== NOTIFICATIONS ====================
    notifications: {
        findByUserId: (userId: string, category?: string): Notification[] => {
            let query = 'SELECT * FROM notifications WHERE user_id = ?';
            const params: any[] = [userId];

            if (category && category !== 'all') {
                query += ' AND category = ?';
                params.push(category);
            }

            query += ' ORDER BY created_at DESC';

            const rows = db.prepare(query).all(...params) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                title: row.title,
                message: row.message,
                type: row.type,
                category: row.category,
                isRead: Boolean(row.is_read),
                createdAt: row.created_at,
            }));
        },

        create: (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
            const id = uuidv4();
            const createdAt = new Date().toISOString();

            db.prepare(`
                INSERT INTO notifications (id, user_id, type, title, message, category, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                notification.userId,
                notification.type || 'system',
                notification.title,
                notification.message,
                notification.category,
                notification.isRead ? 1 : 0,
                createdAt
            );

            return { id, ...notification, createdAt };
        },

        markAsRead: (id: string): void => {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
        },

        markAllAsRead: (userId: string): void => {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
        },

        delete: (id: string): void => {
            db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
        },

        deleteAll: (userId: string): void => {
            db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
        },

        getUnreadCount: (userId: string): number => {
            const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as any;
            return result.count;
        },
    },

    // ==================== REPORTS ====================
    reports: {
        create: async (userId: string, type: string, periodStart: string, periodEnd: string, data: any): Promise<string> => {
            const id = uuidv4();
            const stmt = db.prepare(`
                INSERT INTO reports (id, user_id, report_type, period_start, period_end, data)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run(id, userId, type, periodStart, periodEnd, JSON.stringify(data));
            return id;
        },

        findByUser: async (userId: string): Promise<any[]> => {
            const stmt = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                reportType: row.report_type,
                periodStart: row.period_start,
                periodEnd: row.period_end,
                data: JSON.parse(row.data),
                createdAt: row.created_at,
            }));
        },
    },

    // ==================== EXCHANGE RATES ====================
    exchangeRates: {
        getAll: (): ExchangeRate[] => {
            const rows = db.prepare('SELECT * FROM exchange_rates').all() as any[];
            return rows.map(row => ({
                currencyCode: row.currency_code,
                rate: row.rate,
                lastUpdated: row.last_updated,
                isManual: Boolean(row.is_manual),
            }));
        },

        upsert: (data: ExchangeRate): void => {
            const stmt = db.prepare(`
                INSERT INTO exchange_rates (currency_code, rate, last_updated, is_manual)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(currency_code) DO UPDATE SET
                    rate = excluded.rate,
                    last_updated = excluded.last_updated,
                    is_manual = excluded.is_manual
            `);
            stmt.run(data.currencyCode, data.rate, data.lastUpdated, data.isManual ? 1 : 0);
        },

        updateRate: (currencyCode: string, rate: number, isManual: boolean = true): void => {
            const stmt = db.prepare(`
                UPDATE exchange_rates 
                SET rate = ?, is_manual = ?, last_updated = CURRENT_TIMESTAMP 
                WHERE currency_code = ?
            `);
            stmt.run(rate, isManual ? 1 : 0, currencyCode);
        },
    },

    // ==================== SAVINGS HISTORY ====================
    savingsHistory: {
        upsert: async (userId: string, percentage: number, effectiveMonth: string): Promise<void> => {
            const id = uuidv4();
            const stmt = db.prepare(`
                INSERT INTO savings_percentage_history (id, user_id, percentage, effective_month)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, effective_month) DO UPDATE SET
                    percentage = excluded.percentage
            `);
            stmt.run(id, userId, percentage, effectiveMonth);
        },

        findByUser: async (userId: string): Promise<{ percentage: number; effectiveMonth: string }[]> => {
            const stmt = db.prepare('SELECT percentage, effective_month FROM savings_percentage_history WHERE user_id = ? ORDER BY effective_month ASC');
            const rows = stmt.all(userId) as any[];
            return rows.map(row => ({
                percentage: row.percentage,
                effectiveMonth: row.effective_month
            }));
        }
    },
};

export default StorageService;
