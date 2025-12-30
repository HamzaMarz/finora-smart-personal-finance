
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { FinoraBarChart } from '../components/charts/ChartWrappers';

const Income: React.FC = () => {
  const { t } = useTranslation();
  const { currency, language } = useAppStore();

  const [incomes, setIncomes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sourceName: '',
    amount: '',
    currency: currency,
    recurrence: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    fetchIncomes();
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

  const fetchIncomes = async () => {
    try {
      const response = await api.get('/income');
      setIncomes(response.data);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
    }
  };

  const validateForm = () => {
    if (!formData.sourceName) {
      setError('Please enter a source name');
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
      const payload = {
        sourceName: formData.sourceName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        recurrence: formData.recurrence,
        startDate: formData.startDate,
        isActive: formData.isActive
      };

      if (editingId) {
        await api.put(`/income/${editingId}`, payload);
        setSuccessMsg(t('income_updated_success'));
      } else {
        await api.post('/income', payload);
        setSuccessMsg(t('income_added_success'));
      }

      setShowModal(false);
      resetForm();
      fetchIncomes();
    } catch (error: any) {
      setError(error.message || 'Failed to save income');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_income_confirm'))) return;
    try {
      await api.delete(`/income/${id}`);
      setSuccessMsg(t('income_deleted_success'));
      fetchIncomes();
    } catch (error) {
      console.error('Failed to delete income:', error);
      setError('Failed to delete income');
    }
  };

  const resetForm = () => {
    setFormData({
      sourceName: '',
      amount: '',
      currency: currency,
      recurrence: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setEditingId(null);
  };

  const handleEdit = (income: any) => {
    setFormData({
      sourceName: income.sourceName,
      amount: income.amount.toString(),
      currency: currency,
      recurrence: income.recurrence || 'monthly',
      startDate: income.startDate ? income.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: income.isActive !== undefined ? income.isActive : true
    });
    setEditingId(income.id);
    setShowModal(true);
  };

  // Helper for currency formatting
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  // Chart Data: Income Trend (Incomes over months)
  // Simplified: group by month if we had multiple history, but for now just show sources
  const chartData = incomes.map(inc => ({
    name: inc.sourceName,
    [t('amount')]: inc.amount
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-success to-emerald-600">
            {t('income')}
          </h2>
          <p className="text-slate-400 mt-1">{t('income_sources')}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="h-12 px-6 rounded-xl bg-success text-white font-bold shadow-lg shadow-success/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          {t('add_income')}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl font-bold animate-fade-in">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown Chart */}
        <div className="lg:col-span-2 bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-6">{t('income_breakdown')}</h3>
          <div className="h-[300px]">
            <FinoraBarChart
              data={chartData}
              dataKeys={[t('amount')]}
              height={300}
            />
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-center items-center text-center">
          <div className="size-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <h3 className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">{t('monthly_income')}</h3>
          <p className="text-4xl font-bold text-success">
            {formatAmount(incomes.filter(i => i.isActive).reduce((sum, inc) => sum + inc.amount, 0))}
          </p>
          <div className="mt-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-500">
            {incomes.length} {t('records')}
          </div>
        </div>
      </div>

      {/* Income Sources Table */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold">{t('recent_income')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start">{t('source_name')}</th>
                <th className="px-6 py-4 text-start">{t('recurrence')}</th>
                <th className="px-6 py-4 text-start">{t('amount')}</th>
                <th className="px-6 py-4 text-end">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    {t('no_records_found')}
                  </td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">account_balance</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{inc.sourceName}</p>
                          <p className="text-[10px] text-slate-400">{new Date(inc.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${inc.isActive ? 'bg-success/10 text-success' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}>
                        {t(inc.recurrence.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-success text-base">
                      {formatAmount(inc.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(inc)}
                          className="size-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="size-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              <h3 className="font-bold text-lg">{editingId ? t('edit_income') : t('add_income')}</h3>
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
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('source_name')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={t('placeholder_source')}
                  value={formData.sourceName}
                  onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('amount')} <span className="text-red-500">*</span></label>
                  <div className="flex bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-success focus-within:ring-4 focus-within:ring-success/10 transition-all overflow-hidden">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-20 h-12 px-2 bg-transparent text-sm font-bold outline-none border-r border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ILS">ILS</option>
                      <option value="JOD">JOD</option>
                    </select>
                    <input
                      type="number"
                      required
                      step="0.01"
                      lang="en"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 h-12 px-3 bg-transparent outline-none font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('recurrence')}</label>
                  <div className="relative">
                    <select
                      value={formData.recurrence}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all appearance-none cursor-pointer font-medium"
                    >
                      <option value="once">{t('once')}</option>
                      <option value="weekly">{t('weekly')}</option>
                      <option value="monthly">{t('monthly')}</option>
                      <option value="yearly">{t('yearly')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('date')}</label>
                <input
                  type="date"
                  lang="en"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="size-5 rounded border-slate-300 text-success focus:ring-success"
                />
                <label htmlFor="isActive" className="text-sm font-bold cursor-pointer text-slate-600 dark:text-slate-300">
                  {t('is_active') || 'Active Source'}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-success text-white font-bold rounded-xl shadow-lg shadow-success/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    {editingId ? 'save' : 'add'}
                  </span>
                )}
                {editingId ? t('save_changes') : t('add_income')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
