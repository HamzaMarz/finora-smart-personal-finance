import { Investment } from '../../domain/entities/Investment.js';
import { Money } from '../../domain/value-objects/Money.js';

export interface InvestmentMetrics {
    totalInvested: number;
    currentMarketValue: number;
    totalProfitLoss: number;
    totalROI: number;
    activeInvestments: number;
    closedInvestments: number;
}

/**
 * Application Service: Investment Metrics Calculator
 * Calculates portfolio-wide investment metrics
 */
export class InvestmentMetricsCalculator {
    calculatePortfolioMetrics(
        investments: Investment[],
        targetCurrency: string
    ): InvestmentMetrics {
        const active = investments.filter(inv => inv.status === 'active');
        const closed = investments.filter(inv => inv.status === 'closed');

        let totalInvested = Money.zero(targetCurrency);
        let currentMarketValue = Money.zero(targetCurrency);
        let totalProfitLoss = Money.zero(targetCurrency);

        for (const investment of active) {
            // Note: In real implementation, need currency conversion
            // For now, assuming same currency or pre-converted
            const marketValue = investment.calculateMarketValue();
            const profitLoss = investment.calculateProfitLoss();

            currentMarketValue = currentMarketValue.add(
                Money.create(marketValue.amount, targetCurrency)
            );

            totalProfitLoss = totalProfitLoss.add(
                Money.create(profitLoss.amount, targetCurrency)
            );
        }

        // Calculate total invested from all investments
        for (const investment of investments) {
            const initialAmount = investment.buyPrice.multiply(investment.quantity);
            totalInvested = totalInvested.add(
                Money.create(initialAmount.amount, targetCurrency)
            );
        }

        // Calculate overall ROI
        const totalROI = totalInvested.amount > 0
            ? (totalProfitLoss.amount / totalInvested.amount) * 100
            : 0;

        return {
            totalInvested: totalInvested.amount,
            currentMarketValue: currentMarketValue.amount,
            totalProfitLoss: totalProfitLoss.amount,
            totalROI,
            activeInvestments: active.length,
            closedInvestments: closed.length
        };
    }

    /**
     * Calculate performance by asset type
     */
    calculateByAssetType(
        investments: Investment[]
    ): Map<string, InvestmentMetrics> {
        const byType = new Map<string, Investment[]>();

        // Group by asset type
        for (const investment of investments) {
            const existing = byType.get(investment.assetType) || [];
            existing.push(investment);
            byType.set(investment.assetType, existing);
        }

        // Calculate metrics for each type
        const results = new Map<string, InvestmentMetrics>();
        for (const [type, typeInvestments] of byType.entries()) {
            const currency = typeInvestments[0]?.buyPrice.currency || 'USD';
            results.set(type, this.calculatePortfolioMetrics(typeInvestments, currency));
        }

        return results;
    }
}
