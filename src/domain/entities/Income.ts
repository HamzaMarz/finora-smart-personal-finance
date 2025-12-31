import { ValidationError } from '../../shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';
import { Recurrence, RecurrenceType } from '../value-objects/Recurrence.js';

export interface IncomeProps {
    id: string;
    userId: string;
    sourceName: string;
    amount: Money;
    recurrence: Recurrence;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Domain Entity: Income
 * Represents an income source
 */
export class Income {
    private constructor(private readonly props: IncomeProps) {
        this.validate();
    }

    static create(
        userId: string,
        sourceName: string,
        amount: Money,
        recurrenceType: RecurrenceType,
        startDate: Date,
        isActive: boolean = true
    ): Income {
        return new Income({
            id: crypto.randomUUID(),
            userId,
            sourceName,
            amount,
            recurrence: Recurrence.create(recurrenceType, startDate),
            isActive,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: IncomeProps): Income {
        return new Income(props);
    }

    private validate(): void {
        if (!this.props.sourceName || this.props.sourceName.trim().length === 0) {
            throw new ValidationError('Source name is required', 'sourceName');
        }
        if (this.props.amount.amount < 0) {
            throw new ValidationError('Amount cannot be negative', 'amount');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get sourceName(): string { return this.props.sourceName; }
    get amount(): Money { return this.props.amount; }
    get recurrence(): Recurrence { return this.props.recurrence; }
    get isActive(): boolean { return this.props.isActive; }

    // Business methods
    calculateMonthlyAmount(): Money {
        const monthlyAmount = this.recurrence.calculateMonthlyAmount(this.amount.amount);
        return Money.create(monthlyAmount, this.amount.currency);
    }

    deactivate(): Income {
        return new Income({
            ...this.props,
            isActive: false,
            updatedAt: new Date()
        });
    }

    update(updates: {
        sourceName?: string;
        amount?: Money;
        recurrence?: Recurrence;
        isActive?: boolean;
    }): Income {
        return new Income({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            sourceName: this.props.sourceName,
            amount: this.props.amount.toJSON(),
            recurrence: this.props.recurrence.toJSON(),
            isActive: this.props.isActive,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}
