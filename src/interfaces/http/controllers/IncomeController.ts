import { Request, Response, NextFunction } from 'express';
import { CreateIncome } from '../../../application/use-cases/income/CreateIncome.js';
import { GetUserIncomes } from '../../../application/use-cases/income/GetUserIncomes.js';
import { RepositoryFactory } from '../../../infrastructure/database/sqlite/RepositoryFactory.js';
import { CurrencyConverter } from '../../../application/services/CurrencyConverter.js';

/**
 * Income Controller
 * Thin adapter between HTTP and Use Cases
 */
export class IncomeController {
    private createIncomeUseCase: CreateIncome;
    private getUserIncomesUseCase: GetUserIncomes;

    constructor() {
        // Setup dependencies
        const incomeRepo = RepositoryFactory.getIncomeRepository();
        const notificationRepo = RepositoryFactory.getNotificationRepository();
        const exchangeRateRepo = RepositoryFactory.getExchangeRateRepository();
        const currencyConverter = new CurrencyConverter(exchangeRateRepo);

        // Initialize use cases
        this.createIncomeUseCase = new CreateIncome(
            incomeRepo,
            notificationRepo,
            currencyConverter
        );

        this.getUserIncomesUseCase = new GetUserIncomes(incomeRepo);
    }

    /**
     * GET /income
     * Get all incomes for authenticated user
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const incomes = await this.getUserIncomesUseCase.execute(userId);

            res.json(incomes.map(income => ({
                id: income.id,
                sourceName: income.sourceName,
                amount: income.amount.amount,
                currency: income.amount.currency,
                recurrence: income.recurrence.type,
                startDate: income.recurrence.startDate.toISOString(),
                isActive: income.isActive
            })));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /income
     * Create new income source
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { sourceName, amount, currency, recurrence, startDate, isActive } = req.body;

            const income = await this.createIncomeUseCase.execute({
                userId,
                sourceName,
                amount,
                currency: currency || 'USD',
                recurrence,
                startDate: startDate || new Date().toISOString(),
                isActive: isActive ?? true
            });

            res.status(201).json({
                id: income.id,
                sourceName: income.sourceName,
                amount: amount, // Return original amount (not converted)
                currency: currency || 'USD',
                recurrence: income.recurrence.type,
                startDate: income.recurrence.startDate.toISOString(),
                isActive: income.isActive
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /income/:id
     * Delete income source
     */
    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const incomeRepo = RepositoryFactory.getIncomeRepository();
            await incomeRepo.delete(id);

            res.json({ success: true, message: 'Income source deleted' });
        } catch (error) {
            next(error);
        }
    }
}
