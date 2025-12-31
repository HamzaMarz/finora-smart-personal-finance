import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FinoraAreaChart, FinoraBarChart } from '../components/charts/ChartWrappers';
import { FinanceService } from '../services/finance.service';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';

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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
  };

  const stats = [
    {
      label: 'total_net_worth',
      value: data ? formatVal(data.netWorth) : '---',
      icon: 'account_balance',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'monthly_income',
      value: data ? formatVal(data.income) : '---',
      icon: 'trending_up',
      color: 'text-success',
      bg: 'bg-green-500/10'
    },
    {
      label: 'monthly_expenses',
      value: data ? formatVal(data.expenses) : '---',
      icon: 'trending_down',
      color: 'text-error',
      bg: 'bg-red-500/10'
    },
    {
      label: 'total_savings',
      value: data ? formatVal(data.savings) : '---',
      icon: 'savings',
      color: 'text-secondary',
      bg: 'bg-blue-500/10'
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none hover:border-primary/20">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
                <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">{t(stat.label)}</p>
                <h3 className="text-2xl font-bold text-textPrimary dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">{t('net_worth_trend')}</h3>
              <p className="text-xs text-textSecondary dark:text-gray-400">{t('last_6_months')}</p>
            </div>
            <button className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined text-xl">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <FinoraAreaChart data={netWorthData} dataKey="value" />
          </div>
        </Card>
        <Card className="p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">{t('income_vs_expenses')}</h3>
              <p className="text-xs text-textSecondary dark:text-gray-400">{t('monthly_comparison')}</p>
            </div>
            <button className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined text-xl">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <FinoraBarChart data={incExpData} dataKeys={[t('income'), t('expenses')]} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
