import { ValidationError } from '../../shared/errors/DomainError.js';

/**
 * Value Object: Money
 * Represents a monetary amount with currency
 */
export class Money {
    private constructor(
        public readonly amount: number,
        public readonly currency: string
    ) {
        this.validate();
    }

    static create(amount: number, currency: string): Money {
        return new Money(amount, currency);
    }

    static zero(currency: string = 'USD'): Money {
        return new Money(0, currency);
    }

    private validate(): void {
        if (isNaN(this.amount)) {
            throw new ValidationError('Amount must be a valid number', 'amount');
        }
        if (!this.currency || this.currency.length !== 3) {
            throw new ValidationError('Currency must be a 3-letter code', 'currency');
        }
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new ValidationError(
                `Cannot add ${other.currency} to ${this.currency}`,
                'currency'
            );
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new ValidationError(
                `Cannot subtract ${other.currency} from ${this.currency}`,
                'currency'
            );
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency);
    }

    divide(divisor: number): Money {
        if (divisor === 0) {
            throw new ValidationError('Cannot divide by zero', 'divisor');
        }
        return new Money(this.amount / divisor, this.currency);
    }

    isGreaterThan(other: Money): boolean {
        this.ensureSameCurrency(other);
        return this.amount > other.amount;
    }

    isLessThan(other: Money): boolean {
        this.ensureSameCurrency(other);
        return this.amount < other.amount;
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }

    private ensureSameCurrency(other: Money): void {
        if (this.currency !== other.currency) {
            throw new ValidationError(
                `Cannot compare ${this.currency} with ${other.currency}`,
                'currency'
            );
        }
    }

    toString(): string {
        return `${this.amount.toFixed(2)} ${this.currency}`;
    }

    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency
        };
    }
}
