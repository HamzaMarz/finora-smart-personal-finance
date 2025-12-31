import { User } from '../entities/User.js';

/**
 * Repository Interface: User
 * Defines contract for user persistence
 */
export interface IUserRepository {
    /**
     * Find user by ID
     */
    findById(id: string): Promise<User | null>;

    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Create new user
     */
    create(user: User): Promise<User>;

    /**
     * Update existing user
     */
    update(id: string, updates: Partial<User>): Promise<User>;

    /**
     * Delete user
     */
    delete(id: string): Promise<void>;

    /**
     * Check if email exists
     */
    emailExists(email: string): Promise<boolean>;
}
