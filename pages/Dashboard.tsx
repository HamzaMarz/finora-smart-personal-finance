
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FinoraAreaChart, FinoraBarChart } from '../components/charts/ChartWrappers';
import { FinanceService } from '../services/finance.service';
import { useAppStore } from '../store/useAppStore';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const summary = await FinanceService.getSummary();
        setData(summary);
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currency]);

  const netWorthData = [
    { name: t('jan'), value: 1100000 },
    { name: t('feb'), value: 1150000 },
    { name: t('mar'), value: 1120000 },
    { name: t('apr'), value: 1200000 },
    { name: t('may'), value: 1230000 },
    { name: t('jun'), value: data?.netWorth || 1250000 },
  ];

  const incExpData = [
    { name: t('mar'), [t('income')]: 12000, [t('expenses')]: 4500 },
    { name: t('apr'), [t('income')]: 11500, [t('expenses')]: 4200 },
    { name: t('may'), [t('income')]: 13000, [t('expenses')]: 4800 },
    { name: t('jun'), [t('income')]: data?.income || 12500, [t('expenses')]: data?.expenses || 4200 },
  ];

  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  };

  const stats = [
    { label: 'total_net_worth', value: data ? formatVal(data.netWorth) : '---', color: 'bg-primary' },
    { label: 'monthly_income', value: data ? formatVal(data.income) : '---', color: 'bg-success' },
    { label: 'monthly_expenses', value: data ? formatVal(data.expenses) : '---', color: 'bg-warning' },
    { label: 'total_savings', value: data ? formatVal(data.savings) : '---', color: 'bg-secondary' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('dashboard')}</h2>
          <p className="text-slate-400 mt-1">{t('welcome')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface dark:bg-slate-800 rounded-card p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t(stat.label)}</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-6">{t('net_worth_trend')}</h3>
          <FinoraAreaChart data={netWorthData} dataKey="value" />
        </div>
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-6">{t('income_vs_expenses')}</h3>
          <FinoraBarChart data={incExpData} dataKeys={[t('income'), t('expenses')]} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
