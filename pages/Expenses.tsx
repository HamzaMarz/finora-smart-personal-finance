import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FinoraPieChart, FinoraLineChart } from '../components/charts/ChartWrappers';
import { useExpenses } from '../hooks/useExpenses';
import { useCurrency } from '../hooks/useCurrency';
import { useDateTime } from '../hooks/useDateTime';
import { getTodayDateString } from '../utils/date';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { EXPENSE_CATEGORIES } from '../constants/categories';

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { formatCurrency, currency } = useCurrency();
  const { formatDate, formatTime } = useDateTime();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'none',
    amount: '',
    currency: currency,
    description: '',
    date: getTodayDateString(),
    time: new Date().toTimeString().slice(0, 5),
    isRecurring: false,
    recurrenceType: 'monthly'
  });

  const categories = ['none', ...EXPENSE_CATEGORIES];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expenseDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        expenseDate: expenseDateTime,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined
      };

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await addExpense(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
  };

  const resetForm = () => {
    setFormData({
      category: 'none',
      amount: '',
      currency: currency,
      description: '',
      date: getTodayDateString(),
      time: new Date().toTimeString().slice(0, 5),
      isRecurring: false,
      recurrenceType: 'monthly'
    });
    setEditingId(null);
  };

  const handleEdit = (expense: any) => {
    const d = new Date(expense.expenseDate);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      currency: currency,
      description: expense.description || '',
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      isRecurring: expense.isRecurring || false,
      recurrenceType: expense.recurrenceType || 'monthly'
    });
    setEditingId(expense.id);
    setShowModal(true);
  };

  // Calculate Chart Data
  const categoryData = categories.map(cat => ({
    name: t(cat.toLowerCase()),
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(d => d.value > 0);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const year = d.getFullYear();
    const month = d.getMonth();

    const amount = expenses.filter(e => {
      const eDate = new Date(e.expenseDate);
      return eDate.getMonth() === month && eDate.getFullYear() === year;
    }).reduce((sum, e) => sum + e.amount, 0);

    const monthShort = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    return { name: t(monthShort), [t('amount_label')]: amount };
  });

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      food: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20',
      transport: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
      housing: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
      leisure: 'bg-green-100 text-green-600 dark:bg-green-900/20',
      health: 'bg-red-100 text-red-600 dark:bg-red-900/20',
      shopping: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20'
    };
    return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-600 dark:bg-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      food: 'restaurant',
      transport: 'directions_car',
      housing: 'home',
      leisure: 'confirmation_number',
      health: 'medical_services'
    };
    return iconMap[category.toLowerCase()] || 'receipt';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-textPrimary dark:text-white">{t('expenses')}</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          icon="add"
        >
          {t('add_expense')}
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">{t('expense_category')}</h3>
          {categoryData.length > 0 ? (
            <FinoraPieChart data={categoryData} nameKey="name" valueKey="value" height={250} />
          ) : (
            <EmptyState icon="pie_chart" message={t('no_data')} className="h-[250px]" />
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">
            {t('expense_trend')} <span className="text-sm font-normal text-textSecondary">({t('last_6_months')})</span>
          </h3>
          <FinoraLineChart data={trendData} dataKeys={[t('amount_label')]} height={250} />
        </Card>
      </div>

      {/* Expenses List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg text-textPrimary dark:text-white">{t('recent_expenses')}</h3>
          <span className="text-sm text-textSecondary dark:text-gray-400 font-medium px-2 py-1 bg-white dark:bg-gray-700 rounded-lg">
            {expenses.length} {t('records')}
          </span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto custom-scrollbar">
          {expenses.length === 0 ? (
            <div className="p-16 text-center">
              <EmptyState icon="receipt_long" message={t('no_expenses_found')} />
              <Button variant="ghost" onClick={() => setShowModal(true)} className="mt-4">
                {t('add_first_expense')}
              </Button>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-sm ${getCategoryColor(expense.category)}`}>
                    <span className="material-symbols-outlined text-[24px]">{getCategoryIcon(expense.category)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-textPrimary dark:text-white mb-0.5">
                      {expense.description || t(expense.category.toLowerCase())}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-textSecondary dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDate(expense.expenseDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {formatTime(expense.expenseDate)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-medium">
                        {t(expense.category.toLowerCase())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-error text-lg tracking-tight">- {formatCurrency(expense.amount)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-textSecondary dark:text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="size-8 rounded-lg hover:bg-error/10 text-textSecondary dark:text-gray-400 hover:text-error transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <Card className="w-full max-w-lg overflow-hidden animate-scale-up" onClick={(e) => e?.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-xl text-textPrimary dark:text-white">
                {editingId ? t('edit_expense') : t('add_expense')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-textSecondary dark:text-gray-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Amount & Currency */}
                <div>
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
                    {t('amount')} <span className="text-error">*</span>
                  </label>
                  <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden group hover:border-gray-200 dark:hover:border-gray-700">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-24 px-3 bg-transparent text-sm font-bold outline-none border-r border-gray-200 dark:border-gray-700 cursor-pointer text-textPrimary dark:text-white"
                    >
                      {['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'SAR', 'AED'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 px-4 py-3 bg-transparent outline-none font-2xl font-bold text-textPrimary dark:text-white placeholder-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
                    {t('category')} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-[52px] px-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-medium text-textPrimary dark:text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{t(cat.toLowerCase())}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
                      unfold_more
                    </span>
                  </div>
                </div>

                {/* Description */}
                <Input
                  label={t('description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('date')}
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <Input
                    label={t('time')}
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                {/* Recurring Checkbox */}
                <div className={`p-4 rounded-xl border transition-colors ${formData.isRecurring ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 dark:bg-gray-800/30 border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="size-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-bold cursor-pointer flex-1 text-textPrimary dark:text-white">
                      {t('is_recurring')}
                    </label>
                  </div>
                  {formData.isRecurring && (
                    <div className="mt-3 animate-fade-in pl-8">
                      <select
                        value={formData.recurrenceType}
                        onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-darkSurface outline-none focus:border-primary text-sm font-medium"
                      >
                        <option value="weekly">{t('weekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                        <option value="yearly">{t('yearly')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={loading} fullWidth icon={editingId ? 'save' : 'add'}>
                  {editingId ? t('save_changes') : t('add_expense')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Expenses;
