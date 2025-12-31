import { Expense } from '../entities/Expense.js';
import { DateRange } from '../value-objects/DateRange.js';

/**
 * Repository Interface: Expense
 * Defines contract for expense persistence
 */
export interface IExpenseRepository {
    /**
     * Find expense by ID
     */
    findById(id: string): Promise<Expense | null>;

    /**
     * Find all expenses for a user
     */
    findByUserId(userId: string): Promise<Expense[]>;

    /**
     * Find expenses for a user within a date range
     */
    findByUserIdAndDateRange(userId: string, dateRange: DateRange): Promise<Expense[]>;

    /**
     * Find expenses by category
     */
    findByCategory(userId: string, category: string): Promise<Expense[]>;

    /**
     * Create new expense
     */
    create(expense: Expense): Promise<Expense>;

    /**
     * Update existing expense
     */
    update(id: string, updates: Partial<Expense>): Promise<Expense>;

    /**
     * Delete expense
     */
    delete(id: string): Promise<void>;
}
