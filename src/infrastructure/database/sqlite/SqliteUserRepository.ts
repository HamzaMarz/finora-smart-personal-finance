import { User } from '../../../domain/entities/User.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of IUserRepository
 */
export class SqliteUserRepository implements IUserRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<User | null> {
        const raw = await this.storage.users.findById(id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByEmail(email: string): Promise<User | null> {
        const raw = await this.storage.users.findByEmail(email);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async create(user: User): Promise<User> {
        // This is typically handled by AuthService
        // But we provide the interface for completeness
        throw new Error('User creation should be done through AuthService');
    }

    async update(id: string, updates: Partial<User>): Promise<User> {
        const updateData: any = {};

        if (updates.name) updateData.name = updates.name;
        if (updates.language) updateData.language = updates.language;
        if (updates.baseCurrency) updateData.baseCurrency = updates.baseCurrency;
        if (updates.savingsPercentage !== undefined) {
            updateData.savingsPercentage = updates.savingsPercentage;
        }

        await this.storage.users.update(id, updateData);

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`User ${id} not found after update`);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        // User deletion is typically a soft delete or archive
        // Not implemented in current system
        throw new Error('User deletion not implemented');
    }

    async emailExists(email: string): Promise<boolean> {
        const user = await this.findByEmail(email);
        return user !== null;
    }

    /**
     * Maps raw database data to domain User entity
     */
    private toDomain(raw: any): User {
        return User.fromPersistence({
            id: raw.id,
            email: raw.email,
            name: raw.name,
            passwordHash: raw.passwordHash,
            baseCurrency: raw.baseCurrency,
            language: raw.language || 'en',
            savingsPercentage: raw.savingsPercentage || 0,
            avatar: raw.avatar,
            createdAt: new Date(raw.createdAt),
            updatedAt: new Date(raw.updatedAt)
        });
    }
}
