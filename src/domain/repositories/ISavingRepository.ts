import { Saving } from '../entities/Saving.js';

/**
 * Repository Interface: Saving
 * Defines contract for saving persistence
 */
export interface ISavingRepository {
    /**
     * Find saving by ID
     */
    findById(id: string): Promise<Saving | null>;

    /**
     * Find all savings for a user
     */
    findByUserId(userId: string): Promise<Saving[]>;

    /**
     * Find savings by type
     */
    findByType(userId: string, type: string): Promise<Saving[]>;

    /**
     * Find goal-type savings
     */
    findGoals(userId: string): Promise<Saving[]>;

    /**
     * Create new saving
     */
    create(saving: Saving): Promise<Saving>;

    /**
     * Update existing saving
     */
    update(id: string, updates: Partial<Saving>): Promise<Saving>;

    /**
     * Delete saving
     */
    delete(id: string): Promise<void>;
}
