import { ValidationError } from '../../shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';

export type SavingType = 'manual' | 'automatic' | 'goal';

export interface SavingProps {
    id: string;
    userId: string;
    amount: Money;
    type: SavingType;
    savingDate: Date;
    notes?: string;
    goalName?: string;
    targetAmount?: Money;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Domain Entity: Saving
 * Represents a saving transaction or goal
 */
export class Saving {
    private constructor(private readonly props: SavingProps) {
        this.validate();
    }

    static create(
        userId: string,
        amount: Money,
        type: SavingType,
        savingDate: Date,
        notes?: string,
        goalName?: string,
        targetAmount?: Money
    ): Saving {
        return new Saving({
            id: crypto.randomUUID(),
            userId,
            amount,
            type,
            savingDate,
            notes,
            goalName,
            targetAmount,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: SavingProps): Saving {
        return new Saving(props);
    }

    private validate(): void {
        if (this.props.amount.amount < 0) {
            throw new ValidationError('Amount cannot be negative', 'amount');
        }
        if (this.props.type === 'goal' && !this.props.goalName) {
            throw new ValidationError('Goal name required for goal-type savings', 'goalName');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get amount(): Money { return this.props.amount; }
    get type(): SavingType { return this.props.type; }
    get savingDate(): Date { return this.props.savingDate; }
    get goalName(): string | undefined { return this.props.goalName; }
    get targetAmount(): Money | undefined { return this.props.targetAmount; }

    // Business methods
    isGoalAchieved(totalSaved: Money): boolean {
        if (!this.props.targetAmount) return false;
        return totalSaved.amount >= this.props.targetAmount.amount;
    }

    getProgressPercentage(totalSaved: Money): number {
        if (!this.props.targetAmount || this.props.targetAmount.amount === 0) return 0;
        return Math.min((total Saved.amount / this.props.targetAmount.amount) * 100, 100);
    }

    update(updates: {
        amount?: Money;
        type?: SavingType;
        savingDate?: Date;
        notes?: string;
        goalName?: string;
        targetAmount?: Money;
    }): Saving {
        return new Saving({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            amount: this.props.amount.toJSON(),
            type: this.props.type,
            savingDate: this.props.savingDate.toISOString(),
            notes: this.props.notes,
            goalName: this.props.goalName,
            targetAmount: this.props.targetAmount?.toJSON(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}
