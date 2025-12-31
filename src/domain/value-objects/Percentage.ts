import { ValidationError } from '../../shared/errors/DomainError.js';

/**
 * Value Object: Percentage
 * Represents a percentage value (0-100)
 */
export class Percentage {
    private constructor(public readonly value: number) {
        this.validate();
    }

    static create(value: number): Percentage {
        return new Percentage(value);
    }

    static zero(): Percentage {
        return new Percentage(0);
    }

    static fromDecimal(decimal: number): Percentage {
        return new Percentage(decimal * 100);
    }

    private validate(): void {
        if (isNaN(this.value)) {
            throw new ValidationError('Percentage must be a valid number', 'percentage');
        }
        if (this.value < 0 || this.value > 100) {
            throw new ValidationError('Percentage must be between 0 and 100', 'percentage');
        }
    }

    toDecimal(): number {
        return this.value / 100;
    }

    apply(amount: number): number {
        return amount * this.toDecimal();
    }

    toString(): string {
        return `${this.value.toFixed(2)}%`;
    }

    toJSON() {
        return this.value;
    }
}
