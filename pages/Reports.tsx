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
    } catch (err) {
      console.error(`Export ${format} failed`, err);
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
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            {t('reports')}
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            {t('reports_analyze_desc')}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            disabled={!!exporting}
            onClick={() => handleExport('pdf')}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {exporting === 'pdf' ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">picture_as_pdf</span>}
            {t('export_pdf')}
          </button>
          <button
            disabled={!!exporting}
            onClick={() => handleExport('excel')}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50"
          >
            {exporting === 'excel' ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">table_chart</span>}
            {t('export_excel')}
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-surface dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 inline-flex flex-wrap gap-2">
        {[
          { id: 'this_month', label: t('this_month') },
          { id: 'last_3_months', label: t('last_3_months') },
          { id: 'last_6_months', label: t('last_6_months') },
          { id: 'year', label: t('year') },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${period === p.id ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto thin-scrollbar">
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
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-bold text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {reportData && (
        <div className="animate-fade-in space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-card border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_income')}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatAmount(reportData.summary.totalIncome)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-card border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <span className="material-symbols-outlined">trending_down</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_expenses')}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatAmount(reportData.summary.totalExpenses)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-card border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">savings</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_savings')}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatAmount(reportData.summary.totalSavings)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-card border border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                  </div>
                  <p className="text-primary text-xs font-bold uppercase tracking-widest">{t('net_worth')}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatAmount(reportData.summary.netWorth)}</p>
                </div>
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-8">{t('income_vs_expenses')}</h3>
                  <div className="h-[300px]">
                    <FinoraLineChart data={reportData.charts.monthlyTrend} dataKeys={['income', 'expenses']} height={300} />
                  </div>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-8">{t('expense_dist')}</h3>
                  <div className="h-[300px]">
                    <FinoraPieChart data={reportData.charts.expensesByCategory} nameKey="name" valueKey="value" height={300} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_expenses')}</p>
                    <p className="text-3xl font-black text-red-500 mt-2">{formatAmount(reportData.summary.totalExpenses)}</p>
                  </div>
                  <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <h4 className="text-sm font-bold mb-4">{t('top_categories')}</h4>
                    <div className="space-y-3">
                      {reportData.charts.expensesByCategory.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{cat.name}</span>
                            <span>{((cat.value / reportData.summary.totalExpenses) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(cat.value / reportData.summary.totalExpenses) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-start border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-start">{t('date')}</th>
                        <th className="px-6 py-4 text-start">{t('category')}</th>
                        <th className="px-6 py-4 text-end">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {reportData.details.expenses.map((exp, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(exp.expenseDate)}</p>
                            <p className="text-[10px] text-slate-400">{formatTime(exp.expenseDate)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-[10px] font-black text-slate-500">
                              {t(exp.category.toLowerCase())}
                            </span>
                            {exp.description && <p className="text-[10px] text-slate-400 mt-1">{exp.description}</p>}
                          </td>
                          <td className="px-6 py-4 text-end font-bold text-red-500">{formatAmount(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-6">{t('stability')}</h3>
                <FinoraBarChart data={reportData.details.incomes.map(i => ({ name: i.sourceName, [t('amount')]: i.amount }))} dataKeys={[t('amount')]} height={300} />
              </div>
              <div className="bg-surface dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-start border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-start">{t('source')}</th>
                      <th className="px-6 py-4 text-start">{t('recurrence')}</th>
                      <th className="px-6 py-4 text-end">{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reportData.details.incomes.map((inc, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold">{inc.sourceName}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 capitalize">{inc.recurrence}</td>
                        <td className="px-6 py-4 text-end font-bold text-green-500">{formatAmount(inc.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('invested_capital')}</p>
                  <p className="text-2xl font-black mt-1 text-slate-800 dark:text-white">{formatAmount(reportData.summary.investedCapital)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('market_value')}</p>
                  <p className="text-2xl font-black mt-1 text-primary">{formatAmount(reportData.summary.totalInvestments)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('overall_roi')}</p>
                  <p className={`text-2xl font-black mt-1 ${reportData.summary.investmentROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {reportData.summary.investmentROI.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-start border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-start">{t('asset')}</th>
                      <th className="px-6 py-4 text-start">{t('type')}</th>
                      <th className="px-6 py-4 text-end">{t('buy_price')}</th>
                      <th className="px-6 py-4 text-end">{t('market_price')}</th>
                      <th className="px-6 py-4 text-end">{t('value')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reportData.details.investments.map((inv, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{inv.assetName}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{inv.symbol}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[10px] uppercase font-bold text-slate-500">
                            {t(inv.assetType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-end text-sm text-slate-600 dark:text-slate-400">{formatAmount(inv.buyPriceBase)}</td>
                        <td className="px-6 py-4 text-end text-sm font-bold text-primary">{formatAmount(inv.currentValueBase)}</td>
                        <td className="px-6 py-4 text-end font-bold text-primary">{formatAmount(inv.totalValueBase)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'savings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-8">{t('savings_contributions')}</h3>
                <FinoraAreaChart data={reportData.details.savings.map(s => ({ name: s.savingDate, value: s.amount }))} dataKey="value" height={300} />
              </div>
              <div className="space-y-4">
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_saved_period')}</p>
                  <p className="text-3xl font-black text-primary mt-2">{formatAmount(reportData.summary.totalSavings)}</p>
                </div>
                <div className="bg-surface dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('date')}</th>
                        <th className="px-4 py-3 text-start">{t('type')}</th>
                        <th className="px-4 py-3 text-end">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {reportData.details.savings.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(s.savingDate)}</td>
                          <td className="px-4 py-3 font-bold">{t(s.type)}</td>
                          <td className="px-4 py-3 text-end font-black text-primary">{formatAmount(s.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
