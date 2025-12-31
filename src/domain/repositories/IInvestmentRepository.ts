import { Investment, InvestmentStatus } from '../entities/Investment.js';

/**
 * Repository Interface: Investment
 * Defines contract for investment persistence
 */
export interface IInvestmentRepository {
    /**
     * Find investment by ID
     */
    findById(id: string): Promise<Investment | null>;

    /**
     * Find all investments for a user
     */
    findByUserId(userId: string): Promise<Investment[]>;

    /**
     * Find active investments for a user
     */
    findActiveByUserId(userId: string): Promise<Investment[]>;

    /**
     * Find investments by status
     */
    findByStatus(userId: string, status: InvestmentStatus): Promise<Investment[]>;

    /**
     * Find investments by asset type
     */
    findByAssetType(userId: string, assetType: string): Promise<Investment[]>;

    /**
     * Create new investment
     */
    create(investment: Investment): Promise<Investment>;

    /**
     * Update existing investment
     */
    update(id: string, updates: Partial<Investment>): Promise<Investment>;

    /**
     * Delete investment
     */
    delete(id: string): Promise<void>;

    /**
     * Close investment
     */
    close(id: string, sellPrice: number, closeDate: Date): Promise<Investment>;
}
