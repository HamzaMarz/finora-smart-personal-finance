import { Investment } from '../../../domain/entities/Investment.js';
import { IInvestmentRepository } from '../../../domain/repositories/IInvestmentRepository.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { InvestmentStatus } from '../../../domain/entities/Investment.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of IInvestmentRepository
 */
export class SqliteInvestmentRepository implements IInvestmentRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<Investment | null> {
        const investments = await this.storage.investments.findByUser(''); // Need userId workaround
        const raw = investments.find(inv => inv.id === id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByUserId(userId: string): Promise<Investment[]> {
        const rawInvestments = await this.storage.investments.findByUser(userId);
        return rawInvestments.map(raw => this.toDomain(raw));
    }

    async findActiveByUserId(userId: string): Promise<Investment[]> {
        const investments = await this.findByUserId(userId);
        return investments.filter(inv => inv.status === 'active');
    }

    async findByStatus(userId: string, status: InvestmentStatus): Promise<Investment[]> {
        const investments = await this.findByUserId(userId);
        return investments.filter(inv => inv.status === status);
    }

    async findByAssetType(userId: string, assetType: string): Promise<Investment[]> {
        const investments = await this.findByUserId(userId);
        return investments.filter(inv => inv.assetType === assetType);
    }

    async create(investment: Investment): Promise<Investment> {
        const raw = await this.storage.investments.create({
            userId: investment.userId,
            assetName: investment.assetName,
            assetType: investment.assetType,
            symbol: investment.symbol || '',
            quantity: investment.quantity,
            buyPrice: investment.buyPrice.amount,
            currentValue: investment.currentValue.amount,
            initialAmount: investment.buyPrice.amount * investment.quantity,
            currency: investment.buyPrice.currency,
            purchaseDate: investment.purchaseDate.toISOString(),
            status: investment.status,
            notes: investment.notes || ''
        });

        return this.toDomain(raw);
    }

    async update(id: string, updates: Partial<Investment>): Promise<Investment> {
        const updateData: any = {};

        if (updates.assetName) updateData.assetName = updates.assetName;
        if (updates.quantity) updateData.quantity = updates.quantity;
        if (updates.buyPrice) updateData.buyPrice = updates.buyPrice.amount;
        if (updates.currentValue) updateData.currentValue = updates.currentValue.amount;
        if (updates.notes) updateData.notes = updates.notes;

        await this.storage.investments.update(id, updateData);

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`Investment ${id} not found after update`);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.storage.investments.delete(id);
    }

    async close(id: string, sellPrice: number, closeDate: Date): Promise<Investment> {
        await this.storage.investments.update(id, {
            status: 'closed',
            sellPrice,
            closeDate: closeDate.toISOString(),
            currentValue: sellPrice
        });

        const closed = await this.findById(id);
        if (!closed) {
            throw new Error(`Investment ${id} not found after closing`);
        }

        return closed;
    }

    /**
     * Maps raw database data to domain Investment entity
     */
    private toDomain(raw: any): Investment {
        return Investment.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            assetName: raw.assetName,
            assetType: raw.assetType,
            symbol: raw.symbol,
            quantity: raw.quantity,
            buyPrice: Money.create(raw.buyPrice, raw.currency || 'USD'),
            currentValue: Money.create(raw.currentValue, raw.currency || 'USD'),
            initialAmount: Money.create(raw.initialAmount || (raw.buyPrice * raw.quantity), raw.currency || 'USD'),
            purchaseDate: new Date(raw.purchaseDate),
            status: raw.status,
            sellPrice: raw.sellPrice ? Money.create(raw.sellPrice, raw.currency || 'USD') : undefined,
            closeDate: raw.closeDate ? new Date(raw.closeDate) : undefined,
            notes: raw.notes,
            createdAt: new Date(raw.createdAt || Date.now()),
            updatedAt: new Date(raw.updatedAt || Date.now())
        });
    }
}
