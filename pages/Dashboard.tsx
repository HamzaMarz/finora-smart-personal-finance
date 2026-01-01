import React from 'react';
import { useTranslation } from 'react-i18next';
import { FinoraAreaChart, FinoraBarChart } from '../components/charts/ChartWrappers';
import { useDashboard } from '../hooks/useDashboard';
import { useCurrency } from '../hooks/useCurrency';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading } = useDashboard();
  const { formatCurrency, currency } = useCurrency();

  // Get current month name
  const currentMonth = new Date().toLocaleDateString(t('language') === 'ar' ? 'ar' : 'en', { month: 'short' });

  const netWorthData = [
    { name: currentMonth, value: data?.netWorth || 0 },
  ];

  const incExpData = [
    { name: currentMonth, [t('income')]: data?.income || 0, [t('expenses')]: data?.expenses || 0 },
  ];

  const stats = [
    {
      label: 'total_net_worth',
      value: data ? formatCurrency(data.netWorth) : '---',
      icon: 'account_balance',
      color: 'text-primary',
      bg: 'bg-primary/10 text-primary'
    },
    {
      label: 'monthly_income',
      value: data ? formatCurrency(data.income) : '---',
      icon: 'trending_up',
      color: 'text-success',
      bg: 'bg-green-500/10 text-success'
    },
    {
      label: 'monthly_expenses',
      value: data ? formatCurrency(data.expenses) : '---',
      icon: 'trending_down',
      color: 'text-error',
      bg: 'bg-red-500/10 text-error'
    },
    {
      label: 'total_savings',
      value: data ? formatCurrency(data.savings) : '---',
      icon: 'savings',
      color: 'text-secondary',
      bg: 'bg-blue-500/10 text-secondary'
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            label={t(stat.label)}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-textPrimary dark:text-white">{t('net_worth_trend')}</h3>
              <p className="text-sm text-textSecondary dark:text-gray-400">{t('current_month')}</p>
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
              <h3 className="text-xl font-bold text-textPrimary dark:text-white">{t('income_vs_expenses')}</h3>
              <p className="text-sm text-textSecondary dark:text-gray-400">{t('monthly_comparison')}</p>
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
