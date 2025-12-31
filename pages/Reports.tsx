import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import {
  FinoraLineChart,
  FinoraBarChart,
  FinoraPieChart,
  FinoraAreaChart
} from '../components/charts/ChartWrappers';
import Card from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';

interface ReportData {
  period: { start: string; end: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    totalInvestments: number;
    netWorth: number;
    investedCapital: number;
    investmentROI: number;
  };
  charts: {
    expensesByCategory: { name: string; value: number }[];
    monthlyTrend: any[];
  };
  details: {
    incomes: any[];
    expenses: any[];
    savings: any[];
    investments: any[];
  };
}

const Reports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currency: baseCurrency } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income' | 'investments' | 'savings'>('overview');
  const [period, setPeriod] = useState<string>('last_3_months');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [period, baseCurrency]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const dates = calculateDates(period);
      const response = await api.get(`/reports/generate?periodStart=${dates.start}&periodEnd=${dates.end}`);
      setReportData(response.data);
    } catch (err) {
      console.error('Failed to fetch report data', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculateDates = (p: string) => {
    const end = new Date().toISOString().split('T')[0];
    let start = new Date();
    if (p === 'this_month') start.setDate(1);
    else if (p === 'last_3_months') start.setMonth(start.getMonth() - 2);
    else if (p === 'last_6_months') start.setMonth(start.getMonth() - 5);
    else if (p === 'year') start.setFullYear(start.getFullYear() - 1);

    return { start: start.toISOString().split('T')[0], end };
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(format);
      const dates = calculateDates(period);
      const response = await api.get(`/reports/export/${format}?periodStart=${dates.start}&periodEnd=${dates.end}&lang=${i18n.language}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finora-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} export successful`);
    } catch (err) {
      console.error(`Export ${format} failed`, err);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: baseCurrency,
        currencyDisplay: 'narrowSymbol'
      }).format(amount);
    } catch (e) {
      return `${baseCurrency} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const locale = i18n.language === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(dateStr));
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const locale = i18n.language === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch (e) {
      return '';
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary dark:text-white">
            {t('reports')}
          </h1>
          <p className="text-textSecondary dark:text-gray-400 mt-1">
            {t('reports_analyze_desc')}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            isLoading={exporting === 'pdf'}
            onClick={() => handleExport('pdf')}
            icon="picture_as_pdf"
            variant="ghost"
            className="flex-1 md:flex-none text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            {t('export_pdf')}
          </Button>
          <Button
            isLoading={exporting === 'excel'}
            onClick={() => handleExport('excel')}
            icon="table_chart"
            variant="ghost"
            className="flex-1 md:flex-none text-green-600 hover:bg-green-50 hover:text-green-800"
          >
            {t('export_excel')}
          </Button>
        </div>
      </div>

      {/* Controls Container */}
      <Card className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Scope Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl self-start lg:self-auto w-full lg:w-auto overflow-x-auto custom-scrollbar">
          {[
            { id: 'this_month', label: t('this_month') },
            { id: 'last_3_months', label: t('last_3_months') },
            { id: 'last_6_months', label: t('last_6_months') },
            { id: 'year', label: t('year') },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${period === p.id ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-textSecondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto w-full lg:w-auto justify-start lg:justify-end custom-scrollbar pb-1 lg:pb-0">
          {[
            { id: 'overview', label: t('overview'), icon: 'dashboard_customize' },
            { id: 'expenses', label: t('expenses'), icon: 'payments' },
            { id: 'income', label: t('income'), icon: 'account_balance_wallet' },
            { id: 'investments', label: t('investments'), icon: 'show_chart' },
            { id: 'savings', label: t('savings'), icon: 'savings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap font-bold text-sm ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-textSecondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      {reportData && (
        <div className="animate-fade-in space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'total_income', value: formatAmount(reportData.summary.totalIncome), icon: 'trending_up', color: 'text-success', bg: 'bg-green-500/10 text-green-500' },
                  { label: 'total_expenses', value: formatAmount(reportData.summary.totalExpenses), icon: 'trending_down', color: 'text-error', bg: 'bg-red-500/10 text-red-500' },
                  { label: 'total_savings', value: formatAmount(reportData.summary.totalSavings), icon: 'savings', color: 'text-blue-500', bg: 'bg-blue-500/10 text-blue-500' },
                  { label: 'net_worth', value: formatAmount(reportData.summary.netWorth), icon: 'account_balance', color: 'text-primary', bg: 'bg-primary/10 text-primary' },
                ].map((stat, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`size-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                        <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                      </div>
                    </div>
                    <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t(stat.label)}</p>
                    <p className={`text-2xl font-black mt-1 ${stat.color === 'text-primary' ? 'text-primary' : 'text-textPrimary dark:text-white'}`}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('income_vs_expenses')}</h3>
                  <div className="h-[300px]">
                    <FinoraLineChart data={reportData.charts.monthlyTrend} dataKeys={['income', 'expenses']} height={300} />
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('expense_dist')}</h3>
                  <div className="h-[300px]">
                    {reportData.charts.expensesByCategory.length > 0 ? (
                      <FinoraPieChart data={reportData.charts.expensesByCategory} nameKey="name" valueKey="value" height={300} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-textSecondary">{t('no_data')}</div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  <Card className="p-6">
                    <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t('total_expenses')}</p>
                    <p className="text-3xl font-black text-error mt-2">{formatAmount(reportData.summary.totalExpenses)}</p>
                  </Card>
                  <Card className="p-6 overflow-hidden">
                    <h4 className="text-sm font-bold mb-4 text-textPrimary dark:text-white">{t('top_categories')}</h4>
                    <div className="space-y-4">
                      {reportData.charts.expensesByCategory.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold text-textPrimary dark:text-white">
                            <span>{cat.name}</span>
                            <span>{reportData.summary.totalExpenses > 0 ? ((cat.value / reportData.summary.totalExpenses) * 100).toFixed(0) : 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${reportData.summary.totalExpenses > 0 ? (cat.value / reportData.summary.totalExpenses) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
                <Card className="lg:col-span-2 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4 text-start pl-8">{t('date')}</th>
                          <th className="px-6 py-4 text-start">{t('category')}</th>
                          <th className="px-6 py-4 text-end pr-8">{t('amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {reportData.details.expenses.map((exp, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 pl-8">
                              <p className="text-sm font-bold text-textPrimary dark:text-white">{formatDate(exp.expenseDate)}</p>
                              <p className="text-[10px] text-textSecondary dark:text-gray-400 mt-0.5">{formatTime(exp.expenseDate)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider">
                                {t(exp.category.toLowerCase())}
                              </span>
                              {exp.description && <p className="text-[11px] text-textSecondary dark:text-gray-400 mt-1 max-w-[200px] truncate">{exp.description}</p>}
                            </td>
                            <td className="px-6 py-4 pr-8 text-end font-bold text-error">- {formatAmount(exp.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('stability')}</h3>
                <div className="h-[300px]">
                  <FinoraBarChart data={reportData.details.incomes.map(i => ({ name: i.sourceName, [t('amount')]: i.amount }))} dataKeys={[t('amount')]} height={300} />
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-start pl-8">{t('source')}</th>
                        <th className="px-6 py-4 text-start">{t('recurrence')}</th>
                        <th className="px-6 py-4 text-end pr-8">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.details.incomes.map((inc, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 pl-8 text-sm font-bold text-textPrimary dark:text-white">{inc.sourceName}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider">
                              {inc.recurrence}
                            </span>
                          </td>
                          <td className="px-6 py-4 pr-8 text-end font-bold text-success">+ {formatAmount(inc.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'invested_capital', value: formatAmount(reportData.summary.investedCapital), color: 'text-textPrimary dark:text-white', bg: 'bg-gray-100 dark:bg-gray-800' },
                  { label: 'market_value', value: formatAmount(reportData.summary.totalInvestments), color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'overall_roi', value: `${reportData.summary.investmentROI.toFixed(2)}%`, color: reportData.summary.investmentROI >= 0 ? 'text-success' : 'text-error', bg: reportData.summary.investmentROI >= 0 ? 'bg-success/10' : 'bg-error/10' },
                ].map((stat, i) => (
                  <Card key={i} className="p-6">
                    <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t(stat.label)}</p>
                    <p className={`text-2xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-start pl-8">{t('asset')}</th>
                        <th className="px-6 py-4 text-start">{t('type')}</th>
                        <th className="px-6 py-4 text-end">{t('buy_price')}</th>
                        <th className="px-6 py-4 text-end">{t('market_price')}</th>
                        <th className="px-6 py-4 text-end pr-8">{t('value')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.details.investments.map((inv, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 pl-8">
                            <p className="text-sm font-bold text-textPrimary dark:text-white">{inv.assetName}</p>
                            <p className="text-[10px] text-textSecondary dark:text-gray-400 uppercase font-bold tracking-wider mt-0.5">{inv.symbol}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] uppercase font-bold text-textSecondary dark:text-gray-400">
                              {t(inv.assetType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-end text-sm text-textSecondary dark:text-gray-400 font-medium">{formatAmount(inv.buyPriceBase)}</td>
                          <td className="px-6 py-4 text-end text-sm font-bold text-primary">{formatAmount(inv.currentValueBase)}</td>
                          <td className="px-6 py-4 pr-8 text-end font-bold text-primary">{formatAmount(inv.totalValueBase)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'savings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('savings_contributions')}</h3>
                <div className="h-[300px]">
                  <FinoraAreaChart data={reportData.details.savings.map(s => ({ name: s.savingDate, value: s.amount }))} dataKey="value" height={300} />
                </div>
              </Card>
              <div className="space-y-4">
                <Card className="p-6">
                  <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t('total_saved_period')}</p>
                  <p className="text-3xl font-black text-primary mt-2">{formatAmount(reportData.summary.totalSavings)}</p>
                </Card>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[10px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4 text-start pl-8">{t('date')}</th>
                          <th className="px-6 py-4 text-start">{t('type')}</th>
                          <th className="px-6 py-4 text-end pr-8">{t('amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {reportData.details.savings.map((s, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 pl-8 text-textSecondary dark:text-gray-400 font-medium">{formatDate(s.savingDate)}</td>
                            <td className="px-6 py-4 font-bold text-textPrimary dark:text-white">{t(s.type)}</td>
                            <td className="px-6 py-4 pr-8 text-end font-black text-primary">+ {formatAmount(s.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
