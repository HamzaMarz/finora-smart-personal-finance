import { ValidationError } from '../../shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';

export interface UserProps {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    baseCurrency: string;
    language: string;
    savingsPercentage: number;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Domain Entity: User
 * Represents a user in the system
 */
export class User {
    private constructor(private readonly props: UserProps) {
        this.validate();
    }

    static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
        return new User({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: UserProps): User {
        return new User(props);
    }

    private validate(): void {
        if (!this.props.email || !this.props.email.includes('@')) {
            throw new ValidationError('Invalid email address', 'email');
        }
        if (!this.props.name || this.props.name.length < 2) {
            throw new ValidationError('Name must be at least 2 characters', 'name');
        }
        if (this.props.savingsPercentage < 0 || this.props.savingsPercentage > 100) {
            throw new ValidationError('Savings percentage must be between 0 and 100', 'savingsPercentage');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get email(): string { return this.props.email; }
    get name(): string { return this.props.name; }
    get baseCurrency(): string { return this.props.baseCurrency; }
    get language(): string { return this.props.language; }
    get savingsPercentage(): number { return this.props.savingsPercentage; }
    get avatar(): string | undefined { return this.props.avatar; }

    // Business methods
    updateProfile(updates: {
        name?: string;
        language?: string;
        baseCurrency?: string;
        savingsPercentage?: number;
    }): User {
        return new User({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            email: this.props.email,
            name: this.props.name,
            baseCurrency: this.props.baseCurrency,
            language: this.props.language,
            savingsPercentage: this.props.savingsPercentage,
            avatar: this.props.avatar,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}
