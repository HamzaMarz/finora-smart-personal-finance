import { Saving, SavingType } from '../../../domain/entities/Saving.js';
import { ISavingRepository } from '../../../domain/repositories/ISavingRepository.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of ISavingRepository
 */
export class SqliteSavingRepository implements ISavingRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<Saving | null> {
        const savings = await this.storage.savings.findByUser(''); // Need userId workaround
        const raw = savings.find(sav => sav.id === id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByUserId(userId: string): Promise<Saving[]> {
        const rawSavings = await this.storage.savings.findByUser(userId);
        return rawSavings.map(raw => this.toDomain(raw));
    }

    async findByType(userId: string, type: string): Promise<Saving[]> {
        const savings = await this.findByUserId(userId);
        return savings.filter(saving => saving.type === type);
    }

    async findGoals(userId: string): Promise<Saving[]> {
        const savings = await this.findByUserId(userId);
        return savings.filter(saving => saving.type === 'goal' && saving.goalName);
    }

    async create(saving: Saving): Promise<Saving> {
        const raw = await this.storage.savings.create({
            userId: saving.userId,
            amount: saving.amount.amount,
            type: saving.type,
            savingDate: saving.savingDate.toISOString(),
            notes: saving.notes || ''
            // Note: goalName and targetAmount not in current schema
        });

        return this.toDomain(raw);
    }

    async update(id: string, updates: Partial<Saving>): Promise<Saving> {
        const updateData: any = {};

        if (updates.amount) updateData.amount = updates.amount.amount;
        if (updates.type) updateData.type = updates.type;
        if (updates.savingDate) updateData.savingDate = updates.savingDate.toISOString();
        if (updates.notes) updateData.notes = updates.notes;

        await this.storage.savings.update(id, updateData);

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`Saving ${id} not found after update`);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.storage.savings.delete(id);
    }

    /**
     * Maps raw database data to domain Saving entity
     */
    private toDomain(raw: any): Saving {
        return Saving.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            amount: Money.create(raw.amount, 'USD'), // Stored as USD
            type: raw.type as SavingType,
            savingDate: new Date(raw.savingDate),
            notes: raw.notes,
            goalName: raw.goalName,
            targetAmount: raw.targetAmount ? Money.create(raw.targetAmount, 'USD') : undefined,
            createdAt: new Date(raw.createdAt || Date.now()),
            updatedAt: new Date(raw.updatedAt || Date.now())
        });
    }
}
