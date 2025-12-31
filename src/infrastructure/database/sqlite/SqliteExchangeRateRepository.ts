import { IExchangeRateRepository, ExchangeRate } from '../../../domain/repositories/IExchangeRateRepository.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of IExchangeRateRepository
 */
export class SqliteExchangeRateRepository implements IExchangeRateRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findByCurrency(currencyCode: string): Promise<ExchangeRate | null> {
        const rates = this.storage.exchangeRates.getAll();
        const raw = rates.find(r => r.currencyCode === currencyCode);

        if (!raw) return null;

        return {
            currencyCode: raw.currencyCode,
            rate: raw.rate,
            lastUpdated: new Date(raw.lastUpdated),
            isManual: raw.isManual || false
        };
    }

    async findAll(): Promise<ExchangeRate[]> {
        const rawRates = this.storage.exchangeRates.getAll();

        return rawRates.map(raw => ({
            currencyCode: raw.currencyCode,
            rate: raw.rate,
            lastUpdated: new Date(raw.lastUpdated),
            isManual: raw.isManual || false
        }));
    }

    async update(currencyCode: string, rate: number, isManual: boolean): Promise<void> {
        this.storage.exchangeRates.updateRate(currencyCode, rate, isManual);
    }

    async bulkUpdate(rates: ExchangeRate[]): Promise<void> {
        for (const rate of rates) {
            await this.update(rate.currencyCode, rate.rate, rate.isManual);
        }
    }

    async getLastSyncTime(): Promise<Date | null> {
        const lastSync = this.storage.exchangeRates.getLastSync();
        return lastSync ? new Date(lastSync) : null;
    }
}
