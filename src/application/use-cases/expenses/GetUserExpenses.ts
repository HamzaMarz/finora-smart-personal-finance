import { Expense } from '../../../domain/entities/Expense.js';
import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

/**
 * Use Case: Get User Expenses
 * Retrieves expenses for a user with optional filtering
 */
export class GetUserExpenses {
    constructor(
        private readonly expenseRepository: IExpenseRepository
    ) { }

    async execute(userId: string): Promise<Expense[]> {
        return this.expenseRepository.findByUserId(userId);
    }

    async getByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
        const dateRange = DateRange.fromStrings(startDate, endDate);
        return this.expenseRepository.findByUserIdAndDateRange(userId, dateRange);
    }

    async getByCategory(userId: string, category: string): Promise<Expense[]> {
        return this.expenseRepository.findByCategory(userId, category);
    }

    async getCurrentMonth(userId: string): Promise<Expense[]> {
        const currentMonth = DateRange.currentMonth();
        return this.expenseRepository.findByUserIdAndDateRange(userId, currentMonth);
    }
}
