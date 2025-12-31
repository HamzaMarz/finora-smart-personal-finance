import { Income } from '../entities/Income.js';

/**
 * Repository Interface: Income
 * Defines contract for income persistence
 */
export interface IIncomeRepository {
    /**
     * Find income by ID
     */
    findById(id: string): Promise<Income | null>;

    /**
     * Find all incomes for a user
     */
    findByUserId(userId: string): Promise<Income[]>;

    /**
     * Find active incomes for a user
     */
    findActiveByUserId(userId: string): Promise<Income[]>;

    /**
     * Create new income
     */
    create(income: Income): Promise<Income>;

    /**
     * Update existing income
     */
    update(id: string, updates: Partial<Income>): Promise<Income>;

    /**
     * Delete income
     */
    delete(id: string): Promise<void>;
}
