
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { FinoraAreaChart, FinoraBarChart } from '../components/charts/ChartWrappers';

const Savings: React.FC = () => {
  const { t } = useTranslation();
  const { currency, language } = useAppStore();
  const { user } = useAuthStore();

  const [savings, setSavings] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    currency: currency,
    type: 'manual',
    savingDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchSavings();
    fetchIncome();
  }, [currency]);

  const fetchIncome = async () => {
    try {
      const response = await api.get('/income');
      const activeIncome = response.data.filter((i: any) => i.isActive).reduce((sum: number, inc: any) => sum + inc.amount, 0);
      setTotalIncome(activeIncome);
    } catch (e) {
      console.error('Failed to fetch income for savings calculation');
    }
  };

  // No need for frontend projected calculation as backend provides it now

  // Update form currency when user currency loads
  useEffect(() => {
    if (currency) {
      setFormData(prev => ({ ...prev, currency }));
    }
  }, [currency]);

  // Clear messages
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);

  const fetchSavings = async () => {
    try {
      const response = await api.get('/savings');
      setSavings(response.data);
    } catch (error) {
      console.error('Failed to fetch savings:', error);
    }
  };

  const validateForm = () => {
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
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        type: formData.type,
        savingDate: formData.savingDate,
        notes: formData.notes
      };

      if (editingId) {
        await api.put(`/savings/${editingId}`, payload);
        setSuccessMsg(t('saving_updated_success'));
      } else {
        await api.post('/savings', payload);
        setSuccessMsg(t('saving_added_success'));
      }

      setShowModal(false);
      resetForm();
      fetchSavings();
    } catch (error: any) {
      setError(error.message || 'Failed to save saving');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_saving_confirm'))) return;
    try {
      await api.delete(`/savings/${id}`);
      setSuccessMsg(t('saving_deleted_success'));
      fetchSavings();
    } catch (error) {
      console.error('Failed to delete saving:', error);
      setError('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      currency: currency,
      type: 'manual',
      savingDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingId(null);
  };

  const handleEdit = (saving: any) => {
    setFormData({
      amount: saving.amount.toString(),
      currency: currency,
      type: saving.type || 'manual',
      savingDate: saving.savingDate ? saving.savingDate.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: saving.notes || ''
    });
    setEditingId(saving.id);
    setShowModal(true);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  // Chart Logic & Summary Data
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const projectedAuto = savings
    .filter(s => s.type === 'automatic' && s.savingDate.startsWith(currentMonthStr))
    .reduce((sum, s) => sum + s.amount, 0);

  const totalSavingsAmount = savings.reduce((sum, s) => sum + s.amount, 0);

  const sortedAll = [...savings].sort((a, b) => new Date(a.savingDate).getTime() - new Date(b.savingDate).getTime());

  // Growth Data (Cumulative)
  let cumulative = 0;
  const growthData = sortedAll.reduce((acc: any[], current) => {
    cumulative += current.amount;
    const date = new Date(current.savingDate);
    const month = date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });

    // If same month already exists, update its value
    const last = acc[acc.length - 1];
    if (last && last.name === month) {
      last.savings = cumulative;
    } else {
      acc.push({ name: month, savings: cumulative });
    }
    return acc;
  }, []);

  // Comparison Data (Monthly manual vs auto)
  const comparisonMap = sortedAll.reduce((acc: any, current) => {
    const date = new Date(current.savingDate);
    const month = date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
    if (!acc[month]) acc[month] = { [t('auto')]: 0, [t('manual')]: 0 };

    if (current.type === 'automatic') acc[month][t('auto')] += current.amount;
    else acc[month][t('manual')] += current.amount;

    return acc;
  }, {});

  const comparisonData = Object.keys(comparisonMap).map(month => ({
    name: month,
    ...comparisonMap[month]
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            {t('savings')}
          </h2>
          <p className="text-slate-400 mt-1">{t('recent_savings')}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="h-12 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          {t('add_saving')}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl font-bold animate-fade-in text-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold animate-fade-in text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Savings Card */}
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('total_savings')}</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {formatAmount(totalSavingsAmount)}
            </p>
          </div>
        </div>

        {/* Projected Auto Savings Card */}
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-success/10 text-success flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">auto_mode</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('projected_auto_savings')}</p>
            <p className="text-3xl font-extrabold text-success">
              {formatAmount(projectedAuto)}
            </p>
            <p className="text-[10px] text-slate-400">
              {t('auto_saving_desc', { percentage: user?.savingsPercentage || 0, amount: formatAmount(totalIncome) })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4">{t('savings_growth')}</h3>
          <div className="h-[250px]">
            <FinoraAreaChart data={growthData} dataKey="savings" />
          </div>
        </div>
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4">{t('auto_vs_manual')}</h3>
          <div className="h-[250px]">
            <FinoraBarChart data={comparisonData} dataKeys={[t('auto'), t('manual')]} />
          </div>
        </div>
      </div>

      {/* Savings List */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg">{t('recent_savings')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start">{t('date')}</th>
                <th className="px-6 py-4 text-start">{t('type')}</th>
                <th className="px-6 py-4 text-start">{t('notes')}</th>
                <th className="px-6 py-4 text-start">{t('amount')}</th>
                <th className="px-6 py-4 text-end">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {savings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    {t('no_records_found')}
                  </td>
                </tr>
              ) : (
                [...savings].sort((a, b) => new Date(b.savingDate).getTime() - new Date(a.savingDate).getTime()).map((s) => (
                  <tr key={s.id} className={`group transition-colors ${s.isVirtual ? 'bg-success/5 border-l-4 border-l-success' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                      {new Date(s.savingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${s.type === 'automatic' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}>
                        {s.type === 'automatic' ? t('auto_saving') : t('manual_saving')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]">
                      {s.notes || '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary text-base">
                      {formatAmount(s.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {!s.isVirtual && (
                          <>
                            <button
                              onClick={() => handleEdit(s)}
                              className="size-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="size-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </>
                        )}
                        {s.isVirtual && (
                          <span className="text-[10px] font-bold text-success uppercase tracking-wider px-2 py-1 bg-success/10 rounded-lg">
                            {t('projected')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
              <h3 className="font-bold text-lg">{editingId ? t('edit_saving') : t('add_saving')}</h3>
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
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('amount')} <span className="text-red-500">*</span></label>
                  <div className="flex bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden">
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('type')}</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-medium"
                    >
                      <option value="manual">{t('manual_saving')}</option>
                      <option value="automatic">{t('auto_saving')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('date')}</label>
                  <input
                    type="date"
                    lang="en"
                    value={formData.savingDate}
                    onChange={(e) => setFormData({ ...formData, savingDate: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium resize-none"
                />
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
                {editingId ? t('save_changes') : t('add_saving')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;
