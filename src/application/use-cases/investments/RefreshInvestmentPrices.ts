import { IInvestmentRepository } from '../../../domain/repositories/IInvestmentRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { ExternalServiceError } from '../../../shared/errors/DomainError.js';

export interface MarketDataProvider {
    getAssetPrice(symbol: string, assetType: string, currency: string): Promise<number>;
}

/**
 * Use Case: Refresh Investment Prices
 * Updates current values for all active investments
 */
export class RefreshInvestmentPrices {
    constructor(
        private readonly investmentRepository: IInvestmentRepository,
        private readonly marketDataProvider: MarketDataProvider
    ) { }

    async execute(userId: string): Promise<{ updated: number; failed: number }> {
        // Get all active investments
        const investments = await this.investmentRepository.findActiveByUserId(userId);

        let updated = 0;
        let failed = 0;

        // Update each investment's current value
        for (const investment of investments) {
            if (!investment.symbol || investment.assetType === 'manual') {
                continue; // Skip manual or non-symbol investments
            }

            try {
                // Fetch current price from market data
                const currentPrice = await this.marketDataProvider.getAssetPrice(
                    investment.symbol,
                    investment.assetType,
                    investment.buyPrice.currency
                );

                // Update investment with new price
                const updatedInvestment = investment.updateCurrentValue(
                    investment.buyPrice.currency === investment.currentValue.currency
                        ? { amount: currentPrice, currency: investment.buyPrice.currency }
                        : investment.currentValue
                );

                await this.investmentRepository.update(investment.id, updatedInvestment);
                updated++;

                // Rate limiting delay
                await this.delay(1000);
            } catch (error) {
                console.error(`Failed to refresh ${investment.symbol}:`, error);
                failed++;
            }
        }

        return { updated, failed };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
