import { ICurrencyConverter } from '../../domain/services/ICurrencyConverter.js';
import { IExchangeRateRepository } from '../../domain/repositories/IExchangeRateRepository.js';
import { Money } from '../../domain/value-objects/Money.js';
import { ExternalServiceError } from '../../shared/errors/DomainError.js';

/**
 * Application Service: Currency Converter
 * Implements ICurrencyConverter using ExchangeRateRepository
 */
export class CurrencyConverter implements ICurrencyConverter {
    constructor(
        private readonly exchangeRateRepository: IExchangeRateRepository
    ) { }

    async convertToUSD(amount: number, fromCurrency: string): Promise<Money> {
        if (fromCurrency === 'USD') {
            return Money.create(amount, 'USD');
        }

        const rate = await this.getRate(fromCurrency);
        const usdAmount = amount / rate;
        return Money.create(usdAmount, 'USD');
    }

    async convertFromUSD(amountUSD: number, toCurrency: string): Promise<Money> {
        if (toCurrency === 'USD') {
            return Money.create(amountUSD, 'USD');
        }

        const rate = await this.getRate(toCurrency);
        const convertedAmount = amountUSD * rate;
        return Money.create(convertedAmount, toCurrency);
    }

    async convert(
        amount: number,
        fromCurrency: string,
        toCurrency: string
    ): Promise<Money> {
        if (fromCurrency === toCurrency) {
            return Money.create(amount, toCurrency);
        }

        // Convert through USD as base
        const usdMoney = await this.convertToUSD(amount, fromCurrency);
        return this.convertFromUSD(usdMoney.amount, toCurrency);
    }

    async getRate(currencyCode: string): Promise<number> {
        const exchangeRate = await this.exchangeRateRepository.findByCurrency(currencyCode);

        if (!exchangeRate) {
            throw new ExternalServiceError(
                'ExchangeRate',
                `Rate not found for currency: ${currencyCode}`
            );
        }

        return exchangeRate.rate;
    }

    async syncRates(): Promise<void> {
        // This will be implemented by the infrastructure layer
        // calling the external exchange rate service
        throw new Error('syncRates must be implemented by infrastructure');
    }
}
