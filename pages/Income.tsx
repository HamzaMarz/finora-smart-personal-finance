import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { FinoraBarChart } from '../components/charts/ChartWrappers';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const Income: React.FC = () => {
  const { t } = useTranslation();
  const { currency, language } = useAppStore();

  const [incomes, setIncomes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (currency) {
      setFormData(prev => ({ ...prev, currency }));
    }
  }, [currency]);

  const fetchIncomes = async () => {
    try {
      const response = await api.get('/income');
      setIncomes(response.data);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      toast.error(t('error_fetch_income') || 'Failed to fetch income data');
    }
  };

  const validateForm = () => {
    if (!formData.sourceName) {
      toast.error('Please enter a source name');
      return false;
    }
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
        sourceName: formData.sourceName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        recurrence: formData.recurrence,
        startDate: formData.startDate,
        isActive: formData.isActive
      };

      if (editingId) {
        await api.put(`/income/${editingId}`, payload);
        toast.success(t('income_updated_success'));
      } else {
        await api.post('/income', payload);
        toast.success(t('income_added_success'));
      }

      setShowModal(false);
      resetForm();
      fetchIncomes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save income');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_income_confirm'))) return;
    try {
      await api.delete(`/income/${id}`);
      toast.success(t('income_deleted_success'));
      fetchIncomes();
    } catch (error) {
      console.error('Failed to delete income:', error);
      toast.error('Failed to delete income');
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  const chartData = incomes.map(inc => ({
    name: inc.sourceName,
    [t('amount')]: inc.amount
  }));

  const totalMonthlyIncome = incomes.filter(i => i.isActive).reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary dark:text-white">
            {t('income')}
          </h2>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          variant="primary"
          icon="add"
          className="bg-success shadow-success/20 hover:shadow-success/30"
        >
          {t('add_income')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('income_breakdown')}</h3>
          <div className="h-[300px]">
            <FinoraBarChart
              data={chartData}
              dataKeys={[t('amount')]}
              height={300}
            />
          </div>
        </Card>

        {/* Quick Summary */}
        <Card className="p-6 flex flex-col justify-center items-center text-center">
          <div className="size-20 rounded-3xl bg-success/10 text-success flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
          <h3 className="text-textSecondary dark:text-gray-400 font-bold mb-2 uppercase text-xs tracking-widest">{t('monthly_income')}</h3>
          <p className="text-4xl font-bold text-success tracking-tight">
            {formatAmount(totalMonthlyIncome)}
          </p>
          <div className="mt-6 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-bold text-textSecondary dark:text-gray-400 border border-gray-100 dark:border-gray-800">
            {incomes.length} {t('active_sources')}
          </div>
        </Card>
      </div>

      {/* Income Sources Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-textPrimary dark:text-white">{t('recent_income')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start pl-8">{t('source_name')}</th>
                <th className="px-6 py-4 text-start">{t('recurrence')}</th>
                <th className="px-6 py-4 text-start">{t('amount')}</th>
                <th className="px-6 py-4 text-end pr-8">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-textSecondary dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl opacity-50">money_off</span>
                      <p className="font-medium">{t('no_records_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[20px]">account_balance</span>
                        </div>
                        <div>
                          <p className="font-bold text-textPrimary dark:text-white text-base">{inc.sourceName}</p>
                          <p className="text-[11px] text-textSecondary dark:text-gray-400 mt-0.5 font-medium">{new Date(inc.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${inc.isActive
                        ? 'bg-success/5 border-success/20 text-success'
                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-400'
                        }`}>
                        {t(inc.recurrence.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-success text-base">
                      + {formatAmount(inc.amount)}
                    </td>
                    <td className="px-6 py-5 pr-8">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(inc)}
                          className="size-8 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-textSecondary dark:text-gray-400 hover:text-primary transition-colors flex items-center justify-center shadow-sm hover:shadow"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="size-8 rounded-lg hover:bg-error/10 text-textSecondary dark:text-gray-400 hover:text-error transition-colors flex items-center justify-center hover:shadow-sm"
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
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <Card className="w-full max-w-lg overflow-hidden animate-scale-up" onClick={(e) => e?.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-xl text-textPrimary dark:text-white">{editingId ? t('edit_income') : t('add_income')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Input
                label={t('source_name')}
                required
                value={formData.sourceName}
                onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                placeholder={t('placeholder_source')}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('amount')} <span className="text-error">*</span></label>
                  <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent focus-within:border-success focus-within:ring-4 focus-within:ring-success/10 transition-all overflow-hidden group hover:border-gray-200 dark:hover:border-gray-700">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-20 px-2 bg-transparent text-sm font-bold outline-none border-r border-gray-200 dark:border-gray-700 cursor-pointer text-textPrimary dark:text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ILS">ILS</option>
                      <option value="JOD">JOD</option>
                      <option value="SAR">SAR</option>
                      <option value="AED">AED</option>
                    </select>
                    <input
                      type="number"
                      required
                      step="0.01"
                      lang="en"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 px-3 bg-transparent outline-none font-bold text-lg text-textPrimary dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('recurrence')}</label>
                  <div className="relative">
                    <select
                      value={formData.recurrence}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                      className="w-full h-[48px] px-3 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all appearance-none cursor-pointer font-medium text-textPrimary dark:text-white"
                    >
                      <option value="once">{t('once')}</option>
                      <option value="weekly">{t('weekly')}</option>
                      <option value="monthly">{t('monthly')}</option>
                      <option value="yearly">{t('yearly')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <Input
                label={t('date')}
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />

              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${formData.isActive ? 'bg-success/5 border-success/20' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                <div className={`size-5 rounded border flex items-center justify-center transition-colors ${formData.isActive ? 'bg-success border-success' : 'border-gray-300 bg-white'}`}>
                  {formData.isActive && <span className="material-symbols-outlined text-white text-sm">check</span>}
                </div>
                <label className="text-sm font-bold cursor-pointer text-textPrimary dark:text-white select-none">
                  {t('is_active') || 'Active Source'}
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={loading}
                  fullWidth
                  icon={editingId ? 'save' : 'add'}
                  className="bg-success shadow-success/20 hover:shadow-success/30"
                >
                  {editingId ? t('save_changes') : t('add_income')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Income;
