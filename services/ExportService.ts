import { StorageService } from '../database/storage.service.js';
import PdfPrinter from 'pdfmake';
import ExcelJS from 'exceljs';

import path from 'path';

const fonts = {
    Amiri: {
        normal: path.join(process.cwd(), 'fonts', 'Amiri-Regular.ttf'),
        bold: path.join(process.cwd(), 'fonts', 'Amiri-Regular.ttf'), // Using regular for bold as fallback if bold missing
        italics: path.join(process.cwd(), 'fonts', 'Amiri-Regular.ttf'),
        bolditalics: path.join(process.cwd(), 'fonts', 'Amiri-Regular.ttf')
    },
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const labels = {
    en: {
        title: 'FINORA FINANCIAL REPORT',
        summary: 'Portfolio Summary',
        investments: 'Active Investments',
        expenses: 'Recent Expenses',
        metric: 'Metric',
        amount: 'Amount',
        income_m: 'Total Income (Monthly)',
        income_p: 'Total Income (Period)',
        expense_p: 'Total Expenses (Period)',
        savings_p: 'Total Savings (Period)',
        cash_flow: 'Net Cash Flow',
        asset: 'Asset',
        type: 'Type',
        curr_val: 'Current Value',
        roi: 'ROI',
        date: 'Date',
        category: 'Category',
        description: 'Description',
        generated_on: 'Generated on',
        period: 'Period',
        yes: 'Yes',
        no: 'No',
        source: 'Source',
        recurrence: 'Recurrence',
        active: 'Active',
        quantity: 'Quantity',
        buy_price: 'Buy Price',
        curr_price: 'Current Price',
        value: 'Value',
        // Categories & Types
        housing: 'Housing',
        food: 'Food',
        transport: 'Transport',
        leisure: 'Leisure',
        health: 'Health',
        education: 'Education',
        shopping: 'Shopping',
        utilities: 'Utilities',
        other: 'Other',
        salary: 'Salary',
        freelance: 'Freelance',
        none: 'None',
        stocks: 'Stocks',
        crypto: 'Crypto',
        real_estate: 'Real Estate',
        gold: 'Gold'
    },
    ar: {
        title: 'تقرير فينورا المالي',
        summary: 'ملخص المحفظة',
        investments: 'الاستثمارات النشطة',
        expenses: 'المصاريف الأخيرة',
        metric: 'المعيار',
        amount: 'المبلغ',
        income_m: 'إجمالي الدخل (شهرياً)',
        income_p: 'إجمالي الدخل (للفترة)',
        expense_p: 'إجمالي المصاريف (للفترة)',
        savings_p: 'إجمالي المدخرات (للفترة)',
        cash_flow: 'صافي التدفق النقدي',
        asset: 'الأصل',
        type: 'النوع',
        curr_val: 'القيمة الحالية',
        roi: 'العائد',
        date: 'التاريخ',
        category: 'الفئة',
        description: 'الوصف',
        generated_on: 'تم التوليد في',
        period: 'الفترة',
        yes: 'نعم',
        no: 'لا',
        source: 'المصدر',
        recurrence: 'التكرار',
        active: 'نشط',
        quantity: 'الكمية',
        buy_price: 'سعر الشراء',
        curr_price: 'السعر الحالي',
        value: 'القيمة',
        // Categories & Types
        housing: 'السكن',
        food: 'الطعام',
        transport: 'المواصلات',
        leisure: 'الترفيه',
        health: 'الصحة',
        education: 'التعليم',
        shopping: 'التسوق',
        utilities: 'المرافق',
        other: 'أخرى',
        salary: 'الراتب',
        freelance: 'العمل الحر',
        none: 'بدون',
        stocks: 'أسهُم',
        crypto: 'عملات رقمية',
        real_estate: 'عقارات',
        gold: 'ذهب'
    }
};

export class ExportService {
    // Generate PDF report
    async generatePDF(userId: string, reportType: string, periodStart: string, periodEnd: string, lang: string = 'en'): Promise<Buffer> {
        const user = await StorageService.users.findById(userId);
        const baseCurrency = user?.baseCurrency || 'USD';
        const rates = await StorageService.exchangeRates.getAll();
        const rateMap = Object.fromEntries(rates.map(r => [r.currencyCode, r.rate]));
        const savingsHistory = await StorageService.savingsHistory.findByUser(userId);

        const convertToBase = (amount: number, from: string) => {
            const currency = from.toUpperCase();
            const rateToUSD = rateMap[currency] || 1;
            const baseRateInUSD = rateMap[baseCurrency] || 1;
            return (amount / rateToUSD) * baseRateInUSD;
        };

        const incomes = await StorageService.income.findByUser(userId);
        const expenses = await StorageService.expenses.findByUser(userId);
        const manualSavings = await StorageService.savings.findByUser(userId);
        const investments = await StorageService.investments.findByUser(userId);

        const l: any = (labels as any)[lang] || labels.en;
        const isRtl = lang === 'ar';

        const fixRtl = (text: string | number) => {
            if (!isRtl || typeof text !== 'string') return text;
            return text.split(' ').reverse().join(' ');
        };

        // --- Data Logic (Mirrors generateExcel) ---
        const sDate = new Date(periodStart || 0);
        const eDate = new Date(periodEnd || Date.now());
        const startStr = periodStart || '1970-01-01';
        const endStr = periodEnd || new Date().toISOString().substring(0, 10);

        const filteredExpenses = expenses.filter(e => {
            const dStr = e.expenseDate.substring(0, 10);
            return dStr >= startStr && dStr <= endStr;
        });

        const getMonthsInRange = (d1: Date, d2: Date) => {
            const months = [];
            const current = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), 1));
            const endCmp = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 1));
            while (current <= endCmp) {
                months.push(current.toISOString().substring(0, 7));
                current.setUTCMonth(current.getUTCMonth() + 1);
            }
            return months;
        };
        const periodMonths = getMonthsInRange(sDate, eDate);

        let totalIncome = 0;
        let totalAutoSavings = 0;
        const autoSavingsEntries: any[] = [];

        const getPercentageForMonth = (monthStr: string) => {
            const applicable = savingsHistory
                .filter(h => h.effectiveMonth <= monthStr)
                .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
            return applicable ? applicable.percentage : (user?.savingsPercentage || 0);
        };

        periodMonths.forEach(month => {
            let monthIncomeBase = 0;
            incomes.forEach(inc => {
                if (!inc.isActive) return;
                const incDateStr = inc.startDate || '1970-01-01';
                let isApplicable = false;
                if (inc.recurrence === 'once') isApplicable = incDateStr.startsWith(month);
                else isApplicable = incDateStr <= `${month}-31`;

                if (isApplicable) {
                    let amtUSD = inc.amount;
                    if (inc.recurrence === 'weekly') amtUSD *= 4;
                    else if (inc.recurrence === 'yearly') amtUSD /= 12;
                    monthIncomeBase += convertToBase(amtUSD, 'USD');
                }
            });
            totalIncome += monthIncomeBase;
            const monthPercent = getPercentageForMonth(month);
            if (monthPercent > 0 && monthIncomeBase > 0) {
                const autoAmt = monthIncomeBase * (monthPercent / 100);
                totalAutoSavings += autoAmt;
                autoSavingsEntries.push({
                    savingDate: `${month}-01`,
                    amount: autoAmt,
                    type: 'automatic',
                    notes: `Automatic (${monthPercent}%)`
                });
            }
        });

        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + convertToBase(e.amount, e.currency || 'USD'), 0);

        const filteredManualSavings = manualSavings.filter(s => {
            const dStr = s.savingDate.substring(0, 10);
            return dStr >= startStr && dStr <= endStr;
        }).map(s => ({
            savingDate: s.savingDate,
            amount: convertToBase(s.amount, 'USD'),
            type: 'manual',
            notes: s.notes
        }));

        const allSavings = [...filteredManualSavings, ...autoSavingsEntries].sort((a, b) => a.savingDate.localeCompare(b.savingDate));
        const totalSavings = allSavings.reduce((sum, s) => sum + s.amount, 0);

        // --- PDF Generation ---
        const colors = {
            header: '#BDD7EE', // Light Blue
            total: '#F4B084',  // Light Orange
            title: '#FFC000',  // Gold
            border: '#000000'
        };

        const createTable = (headers: string[], rows: any[][], widths: string[] = []) => {
            const body = [];
            // Header
            body.push(headers.map(h => ({
                text: fixRtl(h),
                fillColor: colors.header,
                bold: true,
                alignment: 'center',
                margin: [0, 5, 0, 5]
            })));

            // Rows
            rows.forEach(r => {
                body.push(r.map(c => ({
                    text: fixRtl(c),
                    alignment: 'center',
                    margin: [0, 5, 0, 5]
                })));
            });

            return {
                table: {
                    headerRows: 1,
                    widths: widths.length ? widths : Array(headers.length).fill('*'),
                    body: body
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => colors.border,
                    vLineColor: () => colors.border,
                }
            };
        };

        const createTotalRow = (label: string, value: string | number, colSpan: number) => {
            const row = new Array(colSpan).fill({});
            row[0] = { text: fixRtl(label), colSpan: colSpan - 1, fillColor: colors.total, bold: true, alignment: 'center', margin: [0, 5, 0, 5] };
            row[colSpan - 1] = { text: fixRtl(value), fillColor: colors.total, bold: true, alignment: 'center', margin: [0, 5, 0, 5] };
            return row;
        };

        // Data Preparation for Tables

        // 1. Income Data
        const incomeRows = incomes.filter(i => i.isActive).map(i => [
            i.sourceName,
            isRtl && (i.recurrence === 'monthly' ? 'شهرياً' : i.recurrence === 'weekly' ? 'أسبوعياً' : 'مرة واحدة') || i.recurrence,
            `${convertToBase(i.amount, 'USD').toFixed(2)} ${baseCurrency}`
        ]);
        const incomeSumVal = incomes.filter(i => i.isActive).reduce((sum, i) => sum + convertToBase(i.amount, 'USD'), 0); // Simplified sum of sources

        // 2. Expense Data
        const expenseRows = filteredExpenses.map(e => {
            const catKey = e.category.toLowerCase();
            const translatedCat = isRtl && (labels.ar as any)[catKey] ? (labels.ar as any)[catKey] : e.category;
            return [
                e.expenseDate.substring(0, 16).replace('T', ' '),
                translatedCat,
                e.description || '',
                `${convertToBase(e.amount, e.currency || 'USD').toFixed(2)} ${baseCurrency}`
            ];
        });

        // 3. Savings Data
        const savingsRows = allSavings.map(s => [
            s.savingDate,
            s.type === 'automatic' ? (isRtl ? 'تلقائي' : 'Automatic') : (isRtl ? 'يدوي' : 'Manual'),
            s.notes || '',
            `${s.amount.toFixed(2)} ${baseCurrency}`
        ]);

        // 4. Investment Data
        const investmentRows = investments.filter(i => i.status === 'active').map(i => {
            const valBase = convertToBase(i.currentValue || 0, i.currency || 'USD') * (i.quantity || 1);
            const typeKey = i.assetType.toLowerCase();
            const translatedType = isRtl && (labels.ar as any)[typeKey] ? (labels.ar as any)[typeKey] :
                isRtl && typeKey === 'stocks' ? 'أسهُم' :
                    isRtl && typeKey === 'crypto' ? 'عملات رقمية' :
                        isRtl && typeKey === 'real_estate' ? 'عقارات' :
                            isRtl && typeKey === 'gold' ? 'ذهب' :
                                i.assetType;
            return [
                i.assetName,
                translatedType,
                (i.quantity || 0).toString(),
                `${convertToBase(i.buyPrice || 0, i.currency || 'USD').toFixed(2)} ${baseCurrency}`,
                `${convertToBase(i.currentValue || 0, i.currency || 'USD').toFixed(2)} ${baseCurrency}`,
                `${valBase.toFixed(2)} ${baseCurrency}`
            ];
        });
        const totalInvVal = investmentRows.reduce((sum, row: any) => sum + parseFloat(row[5].replace(/[^0-9.-]+/g, "")), 0);


        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            defaultStyle: {
                font: 'Amiri',
                fontSize: 12,
                alignment: isRtl ? 'right' : 'left'
            },
            content: [
                // Title
                { text: fixRtl(l.title), style: 'header', fillColor: colors.title, margin: [0, 0, 0, 10], alignment: 'center' },
                { text: fixRtl(`${l.period}: ${periodStart} ${isRtl ? 'إلى' : 'to'} ${periodEnd}`), style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },

                // Summary Table
                { text: fixRtl(l.summary), style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [{ text: fixRtl(l.metric), fillColor: colors.header, bold: true }, { text: fixRtl(l.amount), fillColor: colors.header, bold: true }],
                            [fixRtl(l.income_p), fixRtl(`${totalIncome.toFixed(2)} ${baseCurrency}`)],
                            [fixRtl(l.expense_p), fixRtl(`${totalExpenses.toFixed(2)} ${baseCurrency}`)],
                            [fixRtl(l.savings_p), fixRtl(`${totalSavings.toFixed(2)} ${baseCurrency}`)],
                            [fixRtl(l.cash_flow), { text: fixRtl(`${(totalIncome - totalExpenses).toFixed(2)} ${baseCurrency}`), bold: true, fillColor: (totalIncome - totalExpenses >= 0 ? '#E2EFDA' : '#FCE4D6') }]
                        ]
                    },
                    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => colors.border, vLineColor: () => colors.border }
                },

                { text: '\n' },

                // Income Section
                { text: fixRtl(isRtl ? 'الدخل' : 'Income'), style: 'sectionHeader' },
                (() => {
                    const t = createTable([l.source, l.recurrence, l.amount], incomeRows, ['*', 'auto', 'auto']);
                    t.table.body.push(createTotalRow(isRtl ? 'المجموع' : 'Total', `${incomeSumVal.toFixed(2)} ${baseCurrency}`, 3));
                    return t;
                })(),

                { text: '\n' },

                // Expenses Section
                { text: fixRtl(isRtl ? 'المصاريف' : 'Expenses'), style: 'sectionHeader' },
                (() => {
                    const t = createTable([l.date, l.category, l.description, l.amount], expenseRows, ['auto', 'auto', '*', 'auto']);
                    t.table.body.push(createTotalRow(isRtl ? 'المجموع' : 'Total', `${totalExpenses.toFixed(2)} ${baseCurrency}`, 4));
                    return t;
                })(),

                { text: '\n' },

                // Savings Section
                { text: fixRtl(isRtl ? 'المدخرات' : 'Savings'), style: 'sectionHeader' },
                (() => {
                    const t = createTable([l.date, l.type, isRtl ? 'ملاحظات' : 'Notes', l.amount], savingsRows, ['auto', 'auto', '*', 'auto']);
                    t.table.body.push(createTotalRow(isRtl ? 'المجموع' : 'Total', `${totalSavings.toFixed(2)} ${baseCurrency}`, 4));
                    return t;
                })(),

                { text: '\n' },

                // Investments Section
                { text: fixRtl(isRtl ? 'الاستثمارات' : 'Investments'), style: 'sectionHeader' },
                (() => {
                    const t = createTable([l.asset, l.type, l.quantity, l.buy_price, l.curr_price, l.value], investmentRows, ['*', 'auto', 'auto', 'auto', 'auto', 'auto']);
                    t.table.body.push(createTotalRow(isRtl ? 'المجموع' : 'Total', `${totalInvVal.toFixed(2)} ${baseCurrency}`, 6));
                    return t;
                })()
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
                sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5], color: '#2F5597' } // Dark Blue text for headers
            }
        };

        return new Promise((resolve, reject) => {
            try {
                const printer = new PdfPrinter(fonts);
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);
                pdfDoc.end();
            } catch (error) { reject(error); }
        });
    }

    // Generate Excel report
    async generateExcel(userId: string, reportType: string, periodStart: string, periodEnd: string, lang: string = 'en'): Promise<Buffer> {
        const user = await StorageService.users.findById(userId);
        const baseCurrency = user?.baseCurrency || 'USD';
        const rates = await StorageService.exchangeRates.getAll();
        const rateMap = Object.fromEntries(rates.map(r => [r.currencyCode, r.rate]));
        const savingsHistory = await StorageService.savingsHistory.findByUser(userId);

        const convertToBase = (amount: number, from: string) => {
            const currency = from.toUpperCase();
            const rateToUSD = rateMap[currency] || 1;
            const baseRateInUSD = rateMap[baseCurrency] || 1;
            return (amount / rateToUSD) * baseRateInUSD;
        };

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Finora';
        workbook.lastModifiedBy = 'Finora';
        workbook.created = new Date();

        const incomes = await StorageService.income.findByUser(userId);
        const expenses = await StorageService.expenses.findByUser(userId);
        const manualSavings = await StorageService.savings.findByUser(userId);
        const investments = await StorageService.investments.findByUser(userId);

        const l: any = (labels as any)[lang] || labels.en;
        const isRtl = lang === 'ar';

        const excelFont = { name: 'Arabic Typesetting', size: 14 };
        const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }; // Light Blue
        const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } }; // Light Orange
        const titleFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }; // Gold

        // Helper to add borders
        const addBorders = (row: ExcelJS.Row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.font = excelFont;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        };

        // --- Data Logic (Copied from ReportsController) ---
        const sDate = new Date(periodStart || 0);
        const eDate = new Date(periodEnd || Date.now());
        // String comparisons for reliability
        const startStr = periodStart || '1970-01-01';
        const endStr = periodEnd || new Date().toISOString().substring(0, 10);

        // Filter Expenses
        const filteredExpenses = expenses.filter(e => {
            const dStr = e.expenseDate.substring(0, 10);
            return dStr >= startStr && dStr <= endStr;
        });

        // Calculate Months in Period
        const getMonthsInRange = (d1: Date, d2: Date) => {
            const months = [];
            const current = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), 1));
            const endCmp = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 1)); // Compare only months
            while (current <= endCmp) {
                months.push(current.toISOString().substring(0, 7));
                current.setUTCMonth(current.getUTCMonth() + 1);
            }
            return months;
        };
        const periodMonths = getMonthsInRange(sDate, eDate);

        // Calculate Income & Generate Virtual Savings
        let totalIncome = 0;
        let totalAutoSavings = 0;
        const incomesByMonth: Record<string, number> = {};
        const autoSavingsEntries: any[] = [];

        const getPercentageForMonth = (monthStr: string) => {
            const applicable = savingsHistory
                .filter(h => h.effectiveMonth <= monthStr)
                .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
            return applicable ? applicable.percentage : (user?.savingsPercentage || 0);
        };

        periodMonths.forEach(month => {
            let monthIncomeBase = 0;
            incomes.forEach(inc => {
                if (!inc.isActive) return;
                const incDateStr = inc.startDate || '1970-01-01';

                let isApplicable = false;
                if (inc.recurrence === 'once') {
                    isApplicable = incDateStr.startsWith(month);
                } else {
                    isApplicable = incDateStr <= `${month}-31`;
                }

                if (isApplicable) {
                    let amtUSD = inc.amount;
                    if (inc.recurrence === 'weekly') amtUSD *= 4;
                    else if (inc.recurrence === 'yearly') amtUSD /= 12;
                    monthIncomeBase += convertToBase(amtUSD, 'USD');
                }
            });
            incomesByMonth[month] = monthIncomeBase;
            totalIncome += monthIncomeBase;

            // Auto Savings
            const monthPercent = getPercentageForMonth(month);
            if (monthPercent > 0 && monthIncomeBase > 0) {
                const autoAmt = monthIncomeBase * (monthPercent / 100);
                totalAutoSavings += autoAmt;
                autoSavingsEntries.push({
                    savingDate: `${month}-01`,
                    amount: autoAmt, // Already in Base
                    type: 'automatic',
                    notes: `Automatic (${monthPercent}%)`
                });
            }
        });

        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + convertToBase(e.amount, e.currency || 'USD'), 0);

        // Process Manual Savings
        const filteredManualSavings = manualSavings.filter(s => {
            const dStr = s.savingDate.substring(0, 10);
            return dStr >= startStr && dStr <= endStr;
        }).map(s => ({
            savingDate: s.savingDate,
            amount: convertToBase(s.amount, 'USD'),
            type: 'manual',
            notes: s.notes
        }));

        const allSavings = [...filteredManualSavings, ...autoSavingsEntries].sort((a, b) => a.savingDate.localeCompare(b.savingDate));
        const totalSavings = allSavings.reduce((sum, s) => sum + s.amount, 0);

        // --- SHEET 1: SUMMARY ---
        const summarySheet = workbook.addWorksheet(l.summary, { views: [{ rightToLeft: isRtl }] });

        // Title
        summarySheet.mergeCells('A1:B1');
        const titleRow = summarySheet.getCell('A1');
        titleRow.value = l.title;
        titleRow.font = { name: 'Arabic Typesetting', size: 18, bold: true };
        titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
        titleRow.fill = titleFill;
        titleRow.border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

        // Period
        summarySheet.mergeCells('A2:B2');
        const periodRow = summarySheet.getCell('A2');
        periodRow.value = `${l.period}: ${periodStart} ${isRtl ? 'إلى' : 'to'} ${periodEnd}`;
        periodRow.font = { name: 'Arabic Typesetting', size: 14, bold: true };
        periodRow.alignment = { horizontal: 'center', vertical: 'middle' };
        periodRow.fill = titleFill; // Keep styling consistent
        periodRow.border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

        summarySheet.addRow([]);

        // Summary Table
        const headerRow = summarySheet.addRow([l.metric, l.amount]);
        headerRow.eachCell(cell => {
            cell.fill = headerFill;
            cell.font = { name: 'Arabic Typesetting', size: 14, bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });

        const addSummaryRow = (label: string, value: number) => {
            const r = summarySheet.addRow([label, value]);
            r.getCell(2).numFmt = `"${baseCurrency}" #,##0.00`;
            addBorders(r);
        };

        addSummaryRow(l.income_p, totalIncome);
        addSummaryRow(l.expense_p, totalExpenses);
        addSummaryRow(l.savings_p, totalSavings);
        addSummaryRow(l.cash_flow, totalIncome - totalExpenses); // Cash Flow aka Net Cash Flow

        summarySheet.getColumn(1).width = 40;
        summarySheet.getColumn(2).width = 25;


        // -- HELPER FOR DETAILED SHEETS --
        const createDetailSheet = (name: string, headers: string[], dataRows: any[], totals?: { idx: number, val: number }[]) => {
            const sheet = workbook.addWorksheet(name, { views: [{ rightToLeft: isRtl }] });

            // Header
            const hRow = sheet.addRow(headers);
            hRow.eachCell(c => {
                c.fill = headerFill;
                c.font = { name: 'Arabic Typesetting', size: 14, bold: true };
                c.alignment = { horizontal: 'center' };
                c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            });

            // Data
            dataRows.forEach(row => {
                const r = sheet.addRow(row);
                addBorders(r);
                // Format numbers if needed logic ? handled by caller data
            });

            // Total Row
            if (totals) {
                const totalRowData = new Array(headers.length).fill('');
                totalRowData[0] = isRtl ? 'المجموع' : 'Total';
                totals.forEach(t => totalRowData[t.idx] = t.val);

                const tRow = sheet.addRow(totalRowData);
                tRow.eachCell((c, colNum) => {
                    c.fill = totalFill;
                    c.font = { name: 'Arabic Typesetting', size: 14, bold: true };
                    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                    c.alignment = { horizontal: 'center' };
                });
            }

            sheet.columns.forEach(c => c.width = 20);
        };

        // --- SHEET 2: INCOME ---
        // Using "incomes" array but we want period-relevant presentation?
        // The user's screenshot showed separate specific incomes (Source | Recurrence | Amount).
        // Let's just list active sources and their monthly equivalent or amount?
        // Actually, listing the specific received incomes day-by-day is harder because 'incomes' table is sources, not transactions.
        // We will list the SOURCES and their defined amounts as per the user's apparent income sheet.
        const incomeData = incomes.filter(i => i.isActive).map(i => [
            i.sourceName,
            isRtl ? (i.recurrence === 'monthly' ? 'شهرياً' : i.recurrence === 'weekly' ? 'أسبوعياً' : 'مرة واحدة') : i.recurrence,
            convertToBase(i.amount, 'USD')
        ]);
        // Calculate total of these sources (just summation for display)
        const incomeSum = incomeData.reduce((sum, row) => sum + (row[2] as number), 0);

        createDetailSheet(
            isRtl ? 'الدخل' : 'Income',
            [l.source, l.recurrence, l.amount],
            incomeData,
            [{ idx: 2, val: incomeSum }]
        );

        // --- SHEET 3: EXPENSES ---
        const expData = filteredExpenses.map(e => [
            e.expenseDate.substring(0, 16).replace('T', ' '),
            isRtl && (labels.ar as any)[e.category.toLowerCase()] ? (labels.ar as any)[e.category.toLowerCase()] : e.category,
            e.description || '',
            convertToBase(e.amount, e.currency || 'USD')
        ]);
        createDetailSheet(
            isRtl ? 'المصاريف' : 'Expenses',
            [l.date, l.category, l.description, l.amount],
            expData,
            [{ idx: 3, val: totalExpenses }]
        );

        // --- SHEET 4: SAVINGS (NEW) ---
        const savData = allSavings.map(s => [
            s.savingDate,
            s.type === 'automatic' ? (isRtl ? 'تلقائي' : 'Automatic') : (isRtl ? 'يدوي' : 'Manual'),
            s.notes || '',
            s.amount
        ]);
        createDetailSheet(
            isRtl ? 'المدخرات' : 'Savings',
            [l.date, l.type, isRtl ? 'ملاحظات' : 'Notes', l.amount],
            savData,
            [{ idx: 3, val: totalSavings }]
        );

        // --- SHEET 5: INVESTMENTS ---
        const invData = investments.filter(i => i.status === 'active').map(i => {
            const currVal = convertToBase(i.currentValue || 0, i.currency || 'USD');
            const qty = i.quantity || 0;
            const typeKey = i.assetType.toLowerCase();
            const translatedType = isRtl && (labels.ar as any)[typeKey] ? (labels.ar as any)[typeKey] :
                isRtl && typeKey === 'stocks' ? 'أسهُم' :
                    isRtl && typeKey === 'crypto' ? 'عملات رقمية' :
                        isRtl && typeKey === 'real_estate' ? 'عقارات' :
                            isRtl && typeKey === 'gold' ? 'ذهب' :
                                i.assetType; // Fallbacks for common types if not in labels

            return [
                i.assetName,
                translatedType,
                qty,
                convertToBase(i.buyPrice || 0, i.currency || 'USD'),
                currVal,
                currVal * qty
            ];
        });
        const totalInvVal = invData.reduce((sum, row) => sum + (row[5] as number), 0);

        createDetailSheet(
            isRtl ? 'الاستثمارات' : 'Investments',
            [l.asset, l.type, l.quantity, l.buy_price, l.curr_price, l.value],
            invData,
            [{ idx: 5, val: totalInvVal }]
        );

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer as ArrayBuffer);
    }
}

export default ExportService;
