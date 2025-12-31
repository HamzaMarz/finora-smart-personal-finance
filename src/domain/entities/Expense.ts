import { ValidationError } from '../../shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';

export type ExpenseCategory =
    | 'groceries'
    | 'utilities'
    | 'transportation'
    | 'healthcare'
    | 'entertainment'
    | 'education'
    | 'insurance'
    | 'housing'
    | 'other';

export interface ExpenseProps {
    id: string;
    userId: string;
    category: ExpenseCategory;
    description: string;
    amount: Money;
    expenseDate: Date;
    isRecurring: boolean;
    recurrenceType?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Domain Entity: Expense
 * Represents an expense transaction
 */
export class Expense {
    private constructor(private readonly props: ExpenseProps) {
        this.validate();
    }

    static create(
        userId: string,
        category: ExpenseCategory,
        description: string,
        amount: Money,
        expenseDate: Date,
        isRecurring: boolean = false,
        recurrenceType?: string
    ): Expense {
        return new Expense({
            id: crypto.randomUUID(),
            userId,
            category,
            description,
            amount,
            expenseDate,
            isRecurring,
            recurrenceType,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: ExpenseProps): Expense {
        return new Expense(props);
    }

    private validate(): void {
        if (!this.props.description || this.props.description.trim().length === 0) {
            throw new ValidationError('Description is required', 'description');
        }
        if (this.props.amount.amount < 0) {
            throw new ValidationError('Amount cannot be negative', 'amount');
        }
        if (this.props.isRecurring && !this.props.recurrenceType) {
            throw new ValidationError('Recurrence type required for recurring expenses', 'recurrenceType');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get category(): ExpenseCategory { return this.props.category; }
    get description(): string { return this.props.description; }
    get amount(): Money { return this.props.amount; }
    get expenseDate(): Date { return this.props.expenseDate; }
    get isRecurring(): boolean { return this.props.isRecurring; }

    // Business methods
    isSameMonth(date: Date): boolean {
        return this.props.expenseDate.getMonth() === date.getMonth() &&
            this.props.expenseDate.getFullYear() === date.getFullYear();
    }

    update(updates: {
        category?: ExpenseCategory;
        description?: string;
        amount?: Money;
        expenseDate?: Date;
        isRecurring?: boolean;
        recurrenceType?: string;
    }): Expense {
        return new Expense({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            category: this.props.category,
            description: this.props.description,
            amount: this.props.amount.toJSON(),
            expenseDate: this.props.expenseDate.toISOString(),
            isRecurring: this.props.isRecurring,
            recurrenceType: this.props.recurrenceType,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}
