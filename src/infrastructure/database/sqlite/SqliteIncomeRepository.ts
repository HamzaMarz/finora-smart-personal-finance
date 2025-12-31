import { Income } from '../../../domain/entities/Income.js';
import { IIncomeRepository } from '../../../domain/repositories/IIncomeRepository.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { Recurrence } from '../../../domain/value-objects/Recurrence.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of IIncomeRepository
 * Adapts existing StorageService to domain repository interface
 */
export class SqliteIncomeRepository implements IIncomeRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<Income | null> {
        const incomes = await this.storage.income.findByUser(''); // Will need userId
        const raw = incomes.find(i => i.id === id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByUserId(userId: string): Promise<Income[]> {
        const rawIncomes = await this.storage.income.findByUser(userId);
        return rawIncomes.map(raw => this.toDomain(raw));
    }

    async findActiveByUserId(userId: string): Promise<Income[]> {
        const incomes = await this.findByUserId(userId);
        return incomes.filter(income => income.isActive);
    }

    async create(income: Income): Promise<Income> {
        const raw = await this.storage.income.create({
            userId: income.userId,
            sourceName: income.sourceName,
            amount: income.amount.amount,
            recurrence: income.recurrence.type,
            startDate: income.recurrence.startDate.toISOString(),
            isActive: income.isActive
        });

        return this.toDomain(raw);
    }

    async update(id: string, updates: Partial<Income>): Promise<Income> {
        const updateData: any = {};

        if (updates.sourceName) updateData.sourceName = updates.sourceName;
        if (updates.amount) updateData.amount = updates.amount.amount;
        if (updates.recurrence) {
            updateData.recurrence = updates.recurrence.type;
            updateData.startDate = updates.recurrence.startDate.toISOString();
        }
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

        await this.storage.income.update(id, updateData);

        // Fetch updated income
        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`Income ${id} not found after update`);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.storage.income.delete(id);
    }

    /**
     * Maps raw database data to domain Income entity
     */
    private toDomain(raw: any): Income {
        return Income.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            sourceName: raw.sourceName,
            amount: Money.create(raw.amount, 'USD'), // Stored as USD
            recurrence: Recurrence.create(
                raw.recurrence,
                new Date(raw.startDate)
            ),
            isActive: raw.isActive,
            createdAt: new Date(raw.createdAt || Date.now()),
            updatedAt: new Date(raw.updatedAt || Date.now())
        });
    }
}
