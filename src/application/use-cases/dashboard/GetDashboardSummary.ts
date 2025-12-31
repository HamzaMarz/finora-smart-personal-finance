import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { IIncomeRepository } from '../../../domain/repositories/IIncomeRepository.js';
import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository.js';
import { ISavingRepository } from '../../../domain/repositories/ISavingRepository.js';
import { IInvestmentRepository } from '../../../domain/repositories/IInvestmentRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

export interface DashboardSummary {
    netWorth: number;
    income: number;
    expenses: number;
    savings: number;
    investments: number;
    currency: string;
}

/**
 * Use Case: Get Dashboard Summary
 * Calculates financial summary for current month
 */
export class GetDashboardSummary {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly incomeRepository: IIncomeRepository,
        private readonly expenseRepository: IExpenseRepository,
        private readonly savingRepository: ISavingRepository,
        private readonly investmentRepository: IInvestmentRepository,
        private readonly currencyConverter: ICurrencyConverter
    ) { }

    async execute(userId: string): Promise<DashboardSummary> {
        // Get user to know base currency
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const baseCurrency = user.baseCurrency;
        const currentMonth = DateRange.currentMonth();

        // Fetch all data
        const [incomes, expenses, savings, investments] = await Promise.all([
            this.incomeRepository.findActiveByUserId(userId),
            this.expenseRepository.findByUserIdAndDateRange(userId, currentMonth),
            this.savingRepository.findByUserId(userId),
            this.investmentRepository.findActiveByUserId(userId)
        ]);

        // Calculate monthly income
        let totalIncome = Money.zero(baseCurrency);
        for (const income of incomes) {
            const monthlyAmount = income.calculateMonthlyAmount();
            const converted = await this.currencyConverter.convert(
                monthlyAmount.amount,
                monthlyAmount.currency,
                baseCurrency
            );
            totalIncome = totalIncome.add(converted);
        }

        // Calculate monthly expenses
        let totalExpenses = Money.zero(baseCurrency);
        for (const expense of expenses) {
            const converted = await this.currencyConverter.convert(
                expense.amount.amount,
                expense.amount.currency,
                baseCurrency
            );
            totalExpenses = totalExpenses.add(converted);
        }

        // Calculate total savings
        let totalSavings = Money.zero(baseCurrency);
        for (const saving of savings) {
            const converted = await this.currencyConverter.convert(
                saving.amount.amount,
                saving.amount.currency,
                baseCurrency
            );
            totalSavings = totalSavings.add(converted);
        }

        // Calculate investment value
        let totalInvestments = Money.zero(baseCurrency);
        for (const investment of investments) {
            const marketValue = investment.calculateMarketValue();
            const converted = await this.currencyConverter.convert(
                marketValue.amount,
                marketValue.currency,
                baseCurrency
            );
            totalInvestments = totalInvestments.add(converted);
        }

        // Calculate net worth
        const netWorth = totalIncome
            .subtract(totalExpenses)
            .add(totalSavings)
            .add(totalInvestments);

        return {
            netWorth: netWorth.amount,
            income: totalIncome.amount,
            expenses: totalExpenses.amount,
            savings: totalSavings.amount,
            investments: totalInvestments.amount,
            currency: baseCurrency
        };
    }
}
