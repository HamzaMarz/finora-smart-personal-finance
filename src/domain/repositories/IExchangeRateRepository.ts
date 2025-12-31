export interface ExchangeRate {
    currencyCode: string;
    rate: number; // Rate to USD
    lastUpdated: Date;
    isManual: boolean;
}

/**
 * Repository Interface: ExchangeRate
 * Defines contract for exchange rate persistence
 */
export interface IExchangeRateRepository {
    /**
     * Find exchange rate by currency code
     */
    findByCurrency(currencyCode: string): Promise<ExchangeRate | null>;

    /**
     * Find all exchange rates
     */
    findAll(): Promise<ExchangeRate[]>;

    /**
     * Update exchange rate
     */
    update(currencyCode: string, rate: number, isManual: boolean): Promise<void>;

    /**
     * Bulk update exchange rates
     */
    bulkUpdate(rates: ExchangeRate[]): Promise<void>;

    /**
     * Get last sync time
     */
    getLastSyncTime(): Promise<Date | null>;
}
