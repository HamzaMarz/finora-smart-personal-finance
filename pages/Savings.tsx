import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { FinoraAreaChart, FinoraBarChart } from '../components/charts/ChartWrappers';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const Savings: React.FC = () => {
  const { t } = useTranslation();
  const { currency, language } = useAppStore();
  const { user } = useAuthStore();

  const [savings, setSavings] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (currency) {
      setFormData(prev => ({ ...prev, currency }));
    }
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

  const fetchSavings = async () => {
    try {
      const response = await api.get('/savings');
      setSavings(response.data);
    } catch (error) {
      console.error('Failed to fetch savings:', error);
      toast.error('Failed to fetch savings data');
    }
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

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
        toast.success(t('saving_updated_success'));
      } else {
        await api.post('/savings', payload);
        toast.success(t('saving_added_success'));
      }

      setShowModal(false);
      resetForm();
      fetchSavings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save saving');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_saving_confirm'))) return;
    try {
      await api.delete(`/savings/${id}`);
      toast.success(t('saving_deleted_success'));
      fetchSavings();
    } catch (error) {
      console.error('Failed to delete saving:', error);
      toast.error('Failed to delete');
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
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary dark:text-white">
            {t('savings')}
          </h2>
          <p className="text-textSecondary dark:text-gray-400 mt-1">{t('recent_savings')}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          variant="primary"
          icon="add"
          className="bg-primary shadow-primary/20 hover:shadow-primary/30"
        >
          {t('add_saving')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Savings Card */}
        <Card className="p-6 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <div>
            <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t('total_savings')}</p>
            <p className="text-3xl font-extrabold text-textPrimary dark:text-white mt-1">
              {formatAmount(totalSavingsAmount)}
            </p>
          </div>
        </Card>

        {/* Projected Auto Savings Card */}
        <Card className="p-6 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-success/10 text-success flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">auto_mode</span>
          </div>
          <div>
            <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t('projected_auto_savings')}</p>
            <p className="text-3xl font-extrabold text-success mt-1">
              {formatAmount(projectedAuto)}
            </p>
            <p className="text-[10px] text-textSecondary dark:text-gray-400 mt-1 font-medium">
              {t('auto_saving_desc', { percentage: user?.savingsPercentage || 0, amount: formatAmount(totalIncome) })}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">{t('savings_growth')}</h3>
          <div className="h-[250px]">
            <FinoraAreaChart data={growthData} dataKey="savings" />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 text-textPrimary dark:text-white">{t('auto_vs_manual')}</h3>
          <div className="h-[250px]">
            <FinoraBarChart data={comparisonData} dataKeys={[t('auto'), t('manual')]} />
          </div>
        </Card>
      </div>

      {/* Savings List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg text-textPrimary dark:text-white">{t('recent_savings')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start pl-8">{t('date')}</th>
                <th className="px-6 py-4 text-start">{t('type')}</th>
                <th className="px-6 py-4 text-start">{t('notes')}</th>
                <th className="px-6 py-4 text-start">{t('amount')}</th>
                <th className="px-6 py-4 text-end pr-8">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {savings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-textSecondary dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl opacity-50">money_off</span>
                      <p className="font-medium">{t('no_records_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                [...savings].sort((a, b) => new Date(b.savingDate).getTime() - new Date(a.savingDate).getTime()).map((s) => (
                  <tr key={s.id} className={`group transition-colors ${s.isVirtual ? 'bg-success/5 border-l-4 border-l-success' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <td className="px-6 py-5 pl-8 font-medium text-textPrimary dark:text-white">
                      {new Date(s.savingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.type === 'automatic' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                        {s.type === 'automatic' ? t('auto_saving') : t('manual_saving')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-textSecondary dark:text-gray-400 truncate max-w-[200px]">
                      {s.notes || '-'}
                    </td>
                    <td className="px-6 py-5 font-bold text-primary text-base">
                      + {formatAmount(s.amount)}
                    </td>
                    <td className="px-6 py-5 pr-8">
                      <div className="flex justify-end gap-2 text-right">
                        {!s.isVirtual ? (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-textSecondary dark:text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="size-8 rounded-lg hover:bg-error/10 text-textSecondary dark:text-gray-400 hover:text-error transition-colors flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        ) : (
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
      </Card>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <Card className="w-full max-w-lg overflow-hidden animate-scale-up" onClick={(e) => e?.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-xl text-textPrimary dark:text-white">{editingId ? t('edit_saving') : t('add_saving')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('amount')} <span className="text-error">*</span></label>
                  <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden group hover:border-gray-200 dark:hover:border-gray-700">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-20 h-12 px-2 bg-transparent text-sm font-bold outline-none border-r border-gray-200 dark:border-gray-700 cursor-pointer text-textPrimary dark:text-white"
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
                      className="flex-1 h-12 px-3 bg-transparent outline-none font-bold text-lg text-textPrimary dark:text-white"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('type')}</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-medium text-textPrimary dark:text-white"
                    >
                      <option value="manual">{t('manual_saving')}</option>
                      <option value="automatic">{t('auto_saving')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label={t('date')}
                    type="date"
                    value={formData.savingDate}
                    onChange={(e) => setFormData({ ...formData, savingDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium resize-none text-textPrimary dark:text-white"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={loading} fullWidth icon={editingId ? 'save' : 'add'}>
                  {editingId ? t('save_changes') : t('add_saving')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Savings;
