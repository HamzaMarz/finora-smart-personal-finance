import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinoraPieChart, FinoraLineChart } from '../components/charts/ChartWrappers';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const Expenses: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const currency = user?.baseCurrency || 'USD';

  const formatAmount = (amount: number) => {
    try {
      // Use en-US locale to guarantee standard symbols ($ for USD, ₪ for ILS)
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'narrowSymbol'
      }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toFixed(2)}`;
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

  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'None',
    amount: '',
    currency: currency,
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    isRecurring: false,
    recurrenceType: 'monthly'
  });

  const categories = ['None', 'Housing', 'Food', 'Transport', 'Leisure', 'Health', 'Education', 'Shopping', 'Utilities', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, [currency]);

  // Update form currency when user currency loads
  useEffect(() => {
    if (currency) {
      setFormData(prev => ({ ...prev, currency }));
    }
  }, [currency]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  const validateForm = () => {
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const expenseDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        expenseDate: expenseDateTime,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        setSuccessMsg('Expense updated successfully!');
      } else {
        await api.post('/expenses', payload);
        setSuccessMsg('Expense added successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      setError(error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setSuccessMsg('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      setError('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'None',
      amount: '',
      currency: currency,
      description: '',
      date: new Date().toISOString().split('T')[0],
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
      currency: currency, // Display in current base currency since it comes converted from backend
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

  // Calculate 6-month trend
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthKey = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const month = d.getMonth();

    const amount = expenses.filter(e => {
      const eDate = new Date(e.expenseDate);
      return eDate.getMonth() === month && eDate.getFullYear() === year;
    }).reduce((sum, e) => sum + e.amount, 0);

    const monthShort = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    return { name: t(monthShort), amount };
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {(successMsg || error) && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in ${successMsg ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          <span className="material-symbols-outlined whitespace-nowrap">
            {successMsg ? 'check_circle' : 'error'}
          </span>
          <span className="font-bold">{successMsg || error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('expenses')}</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="h-11 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add</span>
          {t('add_expense')}
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4">{t('expense_category')}</h3>
          {categoryData.length > 0 ? (
            <FinoraPieChart data={categoryData} nameKey="name" valueKey="value" height={250} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 flex-col gap-2">
              <span className="material-symbols-outlined text-4xl">pie_chart</span>
              <p>No expense data available</p>
            </div>
          )}
        </div>
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4">{t('expense_trend')} ({t('last_6_months')})</h3>
          <FinoraLineChart data={trendData} dataKeys={['amount']} height={250} />
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold">{t('recent_expenses')}</h3>
          <span className="text-sm text-slate-400">{expenses.length} {t('records')}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">receipt_long</span>
              </div>
              <p>No expenses found. Add your first expense to track your spending!</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-primary font-bold text-sm hover:underline"
              >
                Add Now
              </button>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${expense.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
                    expense.category === 'Transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                      expense.category === 'Housing' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' :
                        expense.category === 'Leisure' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                          expense.category === 'Health' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                            expense.category === 'Shopping' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/20' :
                              expense.category === 'Utilities' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' :
                                expense.category === 'Education' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-700'
                    }`}>
                    <span className="material-symbols-outlined">
                      {expense.category === 'Food' ? 'restaurant' :
                        expense.category === 'Transport' ? 'directions_car' :
                          expense.category === 'Housing' ? 'home' :
                            expense.category === 'Leisure' ? 'confirmation_number' :
                              expense.category === 'Health' ? 'medical_services' :
                                expense.category === 'Shopping' ? 'shopping_bag' :
                                  expense.category === 'Utilities' ? 'electrical_services' :
                                    expense.category === 'Education' ? 'school' :
                                      'receipt'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">{expense.description || t(expense.category.toLowerCase())}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDate(expense.expenseDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {formatTime(expense.expenseDate)}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                        {t(expense.category.toLowerCase())}
                      </span>
                      {expense.isRecurring && (
                        <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">repeat</span>
                          {expense.recurrenceType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600 dark:text-red-400 text-lg mr-2">
                    - {formatAmount(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="size-9 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit Expense"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="size-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Expense"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-surface dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingId ? t('edit_expense') : t('add_expense')}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('category')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-medium"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{t(cat.toLowerCase())}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      unfold_more
                    </span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('amount')} <span className="text-red-500">*</span></label>
                  <div className="flex bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-20 h-10 px-2 bg-transparent text-sm font-bold outline-none border-r border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                      <option value="GBP">GBP</option>
                      <option value="AUD">AUD</option>
                      <option value="ILS">ILS</option>
                      <option value="JOD">JOD</option>
                      <option value="KWD">KWD</option>
                      <option value="BHD">BHD</option>
                      <option value="OMR">OMR</option>
                      <option value="QAR">QAR</option>
                      <option value="SAR">SAR</option>
                      <option value="AED">AED</option>
                    </select>
                    <input
                      lang="en"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 h-10 px-3 bg-transparent outline-none font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('description')}</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  placeholder={t('placeholder_description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('date')}</label>
                  <input
                    lang="en"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-background dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('time')}</label>
                  <input
                    lang="en"
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-background dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="peer size-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <label htmlFor="isRecurring" className="text-sm font-bold cursor-pointer flex-1">{t('is_recurring')}</label>
                </div>

                {formData.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('recurrence')}</label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-0 outline-none"
                    >
                      <option value="weekly">{t('weekly')}</option>
                      <option value="monthly">{t('monthly')}</option>
                      <option value="yearly">{t('yearly')}</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    {editingId ? 'save' : 'add'}
                  </span>
                )}
                {editingId ? t('save_changes') : t('add_expense')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
