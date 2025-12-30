import { Request, Response } from 'express';
import { StorageService } from '../database/storage.service.js';
import { ExportService } from '../services/ExportService.js';

const exportService = new ExportService();

export class ReportsController {
    static async generate(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const { periodStart, periodEnd } = req.query;

            // Fetch all data
            const user = await StorageService.users.findById(userId);
            const baseCurrency = user?.baseCurrency || 'USD';
            const rates = await StorageService.exchangeRates.getAll();
            const rateMap = Object.fromEntries(rates.map(r => [r.currencyCode, r.rate]));

            const incomes = await StorageService.income.findByUser(userId);
            const expenses = await StorageService.expenses.findByUser(userId);
            const savings = await StorageService.savings.findByUser(userId);
            const investments = await StorageService.investments.findByUser(userId);

            const convertToBase = (amount: number, from: string) => {
                const currency = from.toUpperCase();
                if (currency === baseCurrency) return amount;

                // Convert from original to USD, then USD to base
                const rateToUSD = rateMap[currency] || 1;
                const baseRateInUSD = rateMap[baseCurrency] || 1;

                return (amount / rateToUSD) * baseRateInUSD;
            };

            // Filter data by period
            const start = periodStart ? new Date(periodStart as string) : new Date(0);
            const end = periodEnd ? new Date(periodEnd as string) : new Date();

            // Set end date to the end of the day (23:59:59.999) to include all transactions on that day
            end.setHours(23, 59, 59, 999);

            const getMonthsInRange = (d1: Date, d2: Date) => {
                const months = [];
                const current = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), 1));
                while (current <= d2) {
                    months.push(current.toISOString().substring(0, 7));
                    current.setUTCMonth(current.getUTCMonth() + 1);
                }
                return months;
            };

            const periodMonths = getMonthsInRange(start, end);

            // Filter transactions
            const filteredExpenses = expenses.filter(exp => {
                const date = new Date(exp.expenseDate);
                return date >= start && date <= end;
            });
            const filteredSavings = savings.filter(sav => {
                const date = new Date(sav.savingDate);
                return date >= start && date <= end;
            });

            const savingsHistory = await StorageService.savingsHistory.findByUser(userId);

            const getPercentageForMonth = (monthStr: string) => {
                // Find the percentage that applies to this month
                // History is sorted by effectiveMonth ASC
                // We want:
                // 1. Exact match for monthStr
                // 2. Or the latest entry where effectiveMonth <= monthStr
                // 3. Or fallback to current user.savingsPercentage if no history before/at monthStr exist

                const applicable = savingsHistory
                    .filter(h => h.effectiveMonth <= monthStr)
                    .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];

                return applicable ? applicable.percentage : (user?.savingsPercentage || 0);
            };

            // Calculate Period Income (Accounting for recurrence over the months in period)
            let totalIncome = 0;
            const incomesByMonth: Record<string, number> = {};

            periodMonths.forEach(month => {
                let monthIncomeBase = 0;
                incomes.forEach(inc => {
                    if (!inc.isActive) return;

                    const incDateStr = inc.startDate || '1970-01-01';

                    // Check if income is applicable for this month
                    // Using string comparison to avoid timezone shifts
                    let isApplicable = false;

                    if (inc.recurrence === 'once') {
                        // Applicable only if it occurs in this month
                        isApplicable = incDateStr.startsWith(month);
                    } else {
                        // Applicable if started before or during this month
                        // Comparing YYYY-MM-DD strings works lexicographically
                        isApplicable = incDateStr <= `${month}-31`;
                    }

                    if (isApplicable) {
                        let amtUSD = inc.amount; // In DB it's stored as USD
                        if (inc.recurrence === 'weekly') amtUSD *= 4;
                        else if (inc.recurrence === 'yearly') amtUSD /= 12;

                        monthIncomeBase += convertToBase(amtUSD, 'USD');
                    }
                });
                incomesByMonth[month] = monthIncomeBase;
                totalIncome += monthIncomeBase;
            });

            // Calculate Automatic Savings for the period
            let totalAutoSavings = 0;
            const autoSavingsEntries: any[] = [];

            periodMonths.forEach(month => {
                const monthlyIncome = incomesByMonth[month] || 0;
                const monthPercent = getPercentageForMonth(month);

                if (monthPercent > 0) {
                    const monthlyAutoSaving = monthlyIncome * (monthPercent / 100);
                    if (monthlyAutoSaving > 0) {
                        totalAutoSavings += monthlyAutoSaving;
                        autoSavingsEntries.push({
                            id: `auto-${month}`,
                            amount: monthlyAutoSaving,
                            type: 'automatic',
                            savingDate: `${month}-01`,
                            notes: `Automatic saving (${monthPercent}% of ${monthlyIncome.toFixed(2)})`,
                            isVirtual: true
                        });
                    }
                }
            });

            console.log(`🏦 Total Auto Savings: ${totalAutoSavings}, Entries: ${autoSavingsEntries.length}`);

            // 1. Overview Aggregates
            const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + convertToBase(exp.amount, exp.currency || 'USD'), 0);
            const totalSavings = filteredSavings.reduce((sum, sav) => sum + convertToBase(sav.amount, 'USD'), 0) + totalAutoSavings;

            const activeInvestments = investments.filter(i => i.status === 'active');
            const totalInvestments = activeInvestments.reduce((sum, inv) => {
                const val = (inv.currentValue || 0) * (inv.quantity || 0);
                return sum + convertToBase(val, inv.currency || 'USD');
            }, 0);

            const investedCapital = activeInvestments.reduce((sum, inv) => {
                const cap = (inv.buyPrice || 0) * (inv.quantity || 0);
                return sum + convertToBase(cap, inv.currency || 'USD');
            }, 0);

            // Global Net Worth (Consistent with Dashboard formula)
            const currentMonthStr = new Date().toISOString().substring(0, 7);

            // 1. Calculate standard monthly income (adjusted for recurrence)
            let globalIncomeMonthlyBase = 0;
            incomes.filter(i => i.isActive).forEach(inc => {
                const incDateStr = inc.startDate || '1970-01-01';
                let isApplicable = false;
                if (inc.recurrence === 'once') {
                    isApplicable = incDateStr.startsWith(currentMonthStr);
                } else {
                    isApplicable = incDateStr <= `${currentMonthStr}-31`;
                }

                if (!isApplicable) return;

                let amtUSD = inc.amount;
                if (inc.recurrence === 'weekly') amtUSD *= 4;
                else if (inc.recurrence === 'yearly') amtUSD /= 12;
                globalIncomeMonthlyBase += convertToBase(amtUSD, 'USD');
            });

            // 2. Applicable percentage for CURRENT MONTH
            const currentMonthPercentage = getPercentageForMonth(currentMonthStr);

            // 3. Totals
            const globalExpensesTotalBase = expenses.reduce((sum, e) => sum + convertToBase(e.amount, e.currency || 'USD'), 0);
            const globalSavingsTotalBase = savings.reduce((sum, s) => sum + convertToBase(s.amount, 'USD'), 0) + (globalIncomeMonthlyBase * (currentMonthPercentage / 100));

            // Net Worth = Historical Savings + Projected Auto Saving + Investments - Expenses? 
            // Wait, the formula used in Dashboard is: income - expenses + savings + investments
            const netWorth = globalIncomeMonthlyBase - globalExpensesTotalBase + globalSavingsTotalBase + totalInvestments;

            // 2. Category Distribution
            const expensesByCategory: Record<string, number> = {};
            filteredExpenses.forEach(exp => {
                const amountBase = convertToBase(exp.amount, exp.currency || 'USD');
                expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + amountBase;
            });

            // 3. Time Series Data
            const monthlyTrend = periodMonths.map(month => {
                const expensesInMonth = filteredExpenses
                    .filter(e => e.expenseDate.startsWith(month))
                    .reduce((sum, e) => sum + convertToBase(e.amount, e.currency || 'USD'), 0);

                const monthPercentTrend = getPercentageForMonth(month);
                const savingsInMonth = filteredSavings
                    .filter(s => s.savingDate.startsWith(month))
                    .reduce((sum, s) => sum + convertToBase(s.amount, 'USD'), 0) + (incomesByMonth[month] * (monthPercentTrend / 100));

                return {
                    name: month,
                    income: incomesByMonth[month] || 0,
                    expenses: expensesInMonth,
                    savings: savingsInMonth
                };
            });

            // 4. Investment Metrics
            const investmentROI = investedCapital > 0 ? ((totalInvestments - investedCapital) / investedCapital) * 100 : 0;

            // 5. Details
            const details = {
                incomes: incomes.filter(i => i.isActive).map(inc => ({ ...inc, amount: convertToBase(inc.amount, 'USD') })),
                expenses: filteredExpenses.map(exp => ({ ...exp, amount: convertToBase(exp.amount, exp.currency || 'USD') })),
                savings: [
                    ...filteredSavings.map(sav => ({ ...sav, amount: convertToBase(sav.amount, 'USD') })),
                    ...autoSavingsEntries
                ].sort((a, b) => new Date(b.savingDate).getTime() - new Date(a.savingDate).getTime()),
                investments: investments.map(inv => ({
                    ...inv,
                    buyPriceBase: convertToBase(inv.buyPrice, inv.currency || 'USD'),
                    currentValueBase: convertToBase(inv.currentValue, inv.currency || 'USD'),
                    totalValueBase: convertToBase((inv.currentValue || 0) * (inv.quantity || 1), inv.currency || 'USD')
                }))
            };

            const reportData = {
                period: { start: periodStart, end: periodEnd },
                summary: {
                    totalIncome,
                    totalExpenses,
                    totalSavings,
                    totalInvestments,
                    netWorth,
                    investedCapital,
                    investmentROI
                },
                charts: {
                    expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })),
                    monthlyTrend,
                },
                details
            };

            res.json(reportData);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async list(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const reports = await StorageService.reports.findByUser(userId);
            res.json(reports);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async exportPDF(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const { periodStart, periodEnd, lang } = req.query;

            const pdfBuffer = await exportService.generatePDF(
                userId,
                'monthly', // placeholder
                periodStart as string,
                periodEnd as string,
                lang as string || 'en'
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=finora-report.pdf`);
            res.send(pdfBuffer);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async exportExcel(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const { periodStart, periodEnd, lang } = req.query;

            const excelBuffer = await exportService.generateExcel(
                userId,
                'monthly', // placeholder
                periodStart as string,
                periodEnd as string,
                lang as string || 'en'
            );

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=finora-report.xlsx`);
            res.send(excelBuffer);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default ReportsController;
