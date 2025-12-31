import { Request, Response, NextFunction } from 'express';
import { GetDashboardSummary } from '../../../application/use-cases/dashboard/GetDashboardSummary.js';
import { RepositoryFactory } from '../../../infrastructure/database/sqlite/RepositoryFactory.js';
import { CurrencyConverter } from '../../../application/services/CurrencyConverter.js';

/**
 * Dashboard Controller
 * Provides financial summary for user dashboard
 */
export class DashboardController {
    private getDashboardSummaryUseCase: GetDashboardSummary;

    constructor() {
        // Setup dependencies
        const userRepo = RepositoryFactory.getUserRepository();
        const incomeRepo = RepositoryFactory.getIncomeRepository();
        const expenseRepo = RepositoryFactory.getExpenseRepository(); // Will need to create this
        const savingRepo = RepositoryFactory.getSavingRepository(); // Will need to create this
        const investmentRepo = RepositoryFactory.getInvestmentRepository();
        const exchangeRateRepo = RepositoryFactory.getExchangeRateRepository();
        const currencyConverter = new CurrencyConverter(exchangeRateRepo);

        // Note: This will fail until we create Expense and Saving repositories
        // For now, this shows the pattern
        this.getDashboardSummaryUseCase = new GetDashboardSummary(
            userRepo,
            incomeRepo,
            expenseRepo as any, // TODO: Create SqliteExpenseRepository
            savingRepo as any,  // TODO: Create SqliteSavingRepository  
            investmentRepo,
            currencyConverter
        );
    }

    /**
     * GET /summary
     * Get dashboard financial summary
     */
    async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const summary = await this.getDashboardSummaryUseCase.execute(userId);

            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
}
