import { ValidationError } from '../../shared/errors/DomainError.js';

/**
 * Value Object: DateRange
 * Represents a date range with validation
 */
export class DateRange {
    private constructor(
        public readonly startDate: Date,
        public readonly endDate: Date
    ) {
        this.validate();
    }

    static create(startDate: Date, endDate: Date): DateRange {
        return new DateRange(startDate, endDate);
    }

    static fromStrings(start: string, end: string): DateRange {
        return new DateRange(new Date(start), new Date(end));
    }

    static currentMonth(): DateRange {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return new DateRange(start, end);
    }

    static lastNMonths(months: number): DateRange {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - months);
        return new DateRange(start, end);
    }

    private validate(): void {
        if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            throw new ValidationError('Invalid start date', 'startDate');
        }
        if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
            throw new ValidationError('Invalid end date', 'endDate');
        }
        if (this.startDate > this.endDate) {
            throw new ValidationError('Start date must be before end date', 'dateRange');
        }
    }

    includes(date: Date): boolean {
        return date >= this.startDate && date <= this.endDate;
    }

    overlaps(other: DateRange): boolean {
        return this.startDate <= other.endDate && this.endDate >= other.startDate;
    }

    getDurationInDays(): number {
        const diff = this.endDate.getTime() - this.startDate.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    toString(): string {
        return `${this.startDate.toISOString().split('T')[0]} to ${this.endDate.toISOString().split('T')[0]}`;
    }

    toJSON() {
        return {
            startDate: this.startDate.toISOString(),
            endDate: this.endDate.toISOString()
        };
    }
}
