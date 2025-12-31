import { Money } from '../value-objects/Money.js';

/**
 * Service Interface: Currency Converter
 * Defines contract for currency conversion operations
 */
export interface ICurrencyConverter {
    /**
     * Convert amount to USD
     */
    convertToUSD(amount: number, fromCurrency: string): Promise<Money>;

    /**
     * Convert amount from USD to target currency
     */
    convertFromUSD(amountUSD: number, toCurrency: string): Promise<Money>;

    /**
     * Convert between two currencies
     */
    convert(amount: number, fromCurrency: string, toCurrency: string): Promise<Money>;

    /**
     * Get exchange rate for a currency
     */
    getRate(currencyCode: string): Promise<number>;

    /**
     * Sync exchange rates from external service
     */
    syncRates(): Promise<void>;
}
