import { ValidationError, BusinessRuleViolationError } from '../../shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';

export type AssetType = 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'forex' | 'manual' | 'other';
export type InvestmentStatus = 'active' | 'closed';

export interface InvestmentProps {
    id: string;
    userId: string;
    assetName: string;
    assetType: AssetType;
    symbol?: string;
    quantity: number;
    buyPrice: Money;
    currentValue: Money;
    initialAmount: Money;
    purchaseDate: Date;
    status: InvestmentStatus;
    sellPrice?: Money;
    closeDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Domain Entity: Investment
 * Represents an investment position
 */
export class Investment {
    private constructor(private readonly props: InvestmentProps) {
        this.validate();
    }

    static create(
        userId: string,
        assetName: string,
        assetType: AssetType,
        quantity: number,
        buyPrice: Money,
        currentValue: Money,
        purchaseDate: Date,
        symbol?: string,
        notes?: string
    ): Investment {
        const initialAmount = buyPrice.multiply(quantity);

        return new Investment({
            id: crypto.randomUUID(),
            userId,
            assetName,
            assetType,
            symbol,
            quantity,
            buyPrice,
            currentValue,
            initialAmount,
            purchaseDate,
            status: 'active',
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: InvestmentProps): Investment {
        return new Investment(props);
    }

    private validate(): void {
        if (!this.props.assetName || this.props.assetName.trim().length === 0) {
            throw new ValidationError('Asset name is required', 'assetName');
        }
        if (this.props.quantity <= 0) {
            throw new ValidationError('Quantity must be greater than zero', 'quantity');
        }
        if (this.props.buyPrice.amount < 0) {
            throw new ValidationError('Buy price cannot be negative', 'buyPrice');
        }
        if (this.props.status === 'closed' && !this.props.sellPrice) {
            throw new ValidationError('Sell price required for closed investments', 'sellPrice');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get assetName(): string { return this.props.assetName; }
    get assetType(): AssetType { return this.props.assetType; }
    get quantity(): number { return this.props.quantity; }
    get buyPrice(): Money { return this.props.buyPrice; }
    get currentValue(): Money { return this.props.currentValue; }
    get status(): InvestmentStatus { return this.props.status; }

    // Business methods - Calculations
    calculateProfitLoss(): Money {
        const currentTotal = this.props.currentValue.multiply(this.props.quantity);
        return currentTotal.subtract(this.props.initialAmount);
    }

    calculateROI(): number {
        if (this.props.initialAmount.amount === 0) return 0;
        const profitLoss = this.calculateProfitLoss();
        return (profitLoss.amount / this.props.initialAmount.amount) * 100;
    }

    calculateMarketValue(): Money {
        return this.props.currentValue.multiply(this.props.quantity);
    }

    updateCurrentValue(newValue: Money): Investment {
        if (this.props.status === 'closed') {
            throw new BusinessRuleViolationError('Cannot update value of closed investment');
        }

        return new Investment({
            ...this.props,
            currentValue: newValue,
            updatedAt: new Date()
        });
    }

    close(sellPrice: Money, closeDate: Date): Investment {
        if (this.props.status === 'closed') {
            throw new BusinessRuleViolationError('Investment is already closed');
        }

        return new Investment({
            ...this.props,
            status: 'closed',
            sellPrice,
            closeDate,
            currentValue: sellPrice, // Set current value to sell price
            updatedAt: new Date()
        });
    }

    update(updates: {
        assetName?: string;
        quantity?: number;
        buyPrice?: Money;
        currentValue?: Money;
        notes?: string;
    }): Investment {
        if (this.props.status === 'closed') {
            throw new BusinessRuleViolationError('Cannot update closed investment');
        }

        return new Investment({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            assetName: this.props.assetName,
            assetType: this.props.assetType,
            symbol: this.props.symbol,
            quantity: this.props.quantity,
            buyPrice: this.props.buyPrice.toJSON(),
            currentValue: this.props.currentValue.toJSON(),
            initialAmount: this.props.initialAmount.toJSON(),
            purchaseDate: this.props.purchaseDate.toISOString(),
            status: this.props.status,
            sellPrice: this.props.sellPrice?.toJSON(),
            closeDate: this.props.closeDate?.toISOString(),
            notes: this.props.notes,
            profitLoss: this.calculateProfitLoss().toJSON(),
            roi: this.calculateROI(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}
