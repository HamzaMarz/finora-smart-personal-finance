import { Expense, ExpenseCategory } from '../../../domain/entities/Expense.js';
import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of IExpenseRepository
 */
export class SqliteExpenseRepository implements IExpenseRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<Expense | null> {
        const expenses = await this.storage.expenses.findByUser(''); // Need userId workaround
        const raw = expenses.find(exp => exp.id === id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByUserId(userId: string): Promise<Expense[]> {
        const rawExpenses = await this.storage.expenses.findByUser(userId);
        return rawExpenses.map(raw => this.toDomain(raw));
    }

    async findByUserIdAndDateRange(userId: string, dateRange: DateRange): Promise<Expense[]> {
        const expenses = await this.findByUserId(userId);
        return expenses.filter(expense =>
            dateRange.includes(expense.expenseDate)
        );
    }

    async findByCategory(userId: string, category: string): Promise<Expense[]> {
        const expenses = await this.findByUserId(userId);
        return expenses.filter(expense => expense.category === category);
    }

    async create(expense: Expense): Promise<Expense> {
        const raw = await this.storage.expenses.create({
            userId: expense.userId,
            category: expense.category,
            description: expense.description,
            amount: expense.amount.amount,
            currency: expense.amount.currency,
            expenseDate: expense.expenseDate.toISOString(),
            isRecurring: expense.isRecurring,
            recurrenceType: expense.isRecurring ? expense.recurrenceType : null
        });

        return this.toDomain(raw);
    }

    async update(id: string, updates: Partial<Expense>): Promise<Expense> {
        const updateData: any = {};

        if (updates.category) updateData.category = updates.category;
        if (updates.description) updateData.description = updates.description;
        if (updates.amount) updateData.amount = updates.amount.amount;
        if (updates.expenseDate) updateData.expenseDate = updates.expenseDate.toISOString();
        if (updates.isRecurring !== undefined) updateData.isRecurring = updates.isRecurring;
        if (updates.recurrenceType) updateData.recurrenceType = updates.recurrenceType;

        await this.storage.expenses.update(id, updateData);

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`Expense ${id} not found after update`);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.storage.expenses.delete(id);
    }

    /**
     * Maps raw database data to domain Expense entity
     */
    private toDomain(raw: any): Expense {
        return Expense.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            category: raw.category as ExpenseCategory,
            description: raw.description,
            amount: Money.create(raw.amount, raw.currency || 'USD'),
            expenseDate: new Date(raw.expenseDate),
            isRecurring: raw.isRecurring || false,
            recurrenceType: raw.recurrenceType,
            createdAt: new Date(raw.createdAt || Date.now()),
            updatedAt: new Date(raw.updatedAt || Date.now())
        });
    }
}
