import { ValidationError } from '../../shared/errors/DomainError.js';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Value Object: Recurrence
 * Represents income/expense recurrence pattern
 */
export class Recurrence {
    private constructor(
        public readonly type: RecurrenceType,
        public readonly startDate: Date
    ) {
        this.validate();
    }

    static create(type: RecurrenceType, startDate: Date): Recurrence {
        return new Recurrence(type, startDate);
    }

    static once(date: Date): Recurrence {
        return new Recurrence('once', date);
    }

    static monthly(startDate: Date): Recurrence {
        return new Recurrence('monthly', startDate);
    }

    private validate(): void {
        const validTypes: RecurrenceType[] = ['once', 'daily', 'weekly', 'monthly', 'yearly'];
        if (!validTypes.includes(this.type)) {
            throw new ValidationError(`Invalid recurrence type: ${this.type}`, 'recurrence');
        }
        if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            throw new ValidationError('Invalid start date', 'startDate');
        }
    }

    isApplicableForMonth(monthStr: string): boolean {
        const startDateStr = this.startDate.toISOString().substring(0, 10);

        if (this.type === 'once') {
            return startDateStr.startsWith(monthStr);
        }

        return startDateStr <= `${monthStr}-31`;
    }

    calculateMonthlyAmount(baseAmount: number): number {
        switch (this.type) {
            case 'once':
                return baseAmount;
            case 'daily':
                return baseAmount * 30;
            case 'weekly':
                return baseAmount * 4;
            case 'monthly':
                return baseAmount;
            case 'yearly':
                return baseAmount / 12;
            default:
                return baseAmount;
        }
    }

    toString(): string {
        return this.type;
    }

    toJSON() {
        return {
            type: this.type,
            startDate: this.startDate.toISOString()
        };
    }
}
