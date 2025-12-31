import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import { FinoraLineChart, FinoraPieChart } from '../components/charts/ChartWrappers';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

interface Investment {
  id: string;
  assetName: string;
  assetType: 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'forex' | 'manual' | 'other';
  symbol?: string;
  quantity: number;
  buyPrice: number;
  currentValue: number;
  initialAmount: number;
  sellPrice?: number;
  currency: string;
  purchaseDate: string;
  closeDate?: string;
  status: 'active' | 'closed';
  notes?: string;
  profitLoss: number;
  roi: number;
}

const Investments: React.FC = () => {
  const { t } = useTranslation();
  const { currency: baseCurrency } = useAppStore();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // State for text inputs (decimal handling)
  const [inputValues, setInputValues] = useState({
    quantity: '1',
    buyPrice: '0',
    sellPrice: '0'
  });

  const [formData, setFormData] = useState({
    id: '',
    assetName: '',
    assetType: 'stocks',
    symbol: '',
    quantity: 1,
    buyPrice: 0,
    currentValue: 0,
    currency: 'USD',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    sellPrice: 0,
    closeDate: new Date().toISOString().split('T')[0],
  });

  const [isClosing, setIsClosing] = useState(false);
  const [supportedCryptos, setSupportedCryptos] = useState<any[]>([]);
  const [supportedForex, setSupportedForex] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    fetchInvestments();
    fetchSupportedAssets();
  }, [baseCurrency]);

  const fetchSupportedAssets = async () => {
    try {
      setLoadingAssets(true);
      const [cryptoRes, forexRes] = await Promise.all([
        api.get('/api/market/supported/crypto'),
        api.get('/api/market/supported/forex')
      ]);
      setSupportedCryptos(cryptoRes.data);
      setSupportedForex(forexRes.data);
    } catch (err) {
      console.error('Failed to fetch supported assets', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/investments');
      setInvestments(response.data);
    } catch (err: any) {
      toast.error('Failed to fetch investments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearchError(null);
    try {
      setSearching(true);
      const response = await api.get(`/api/market/search?q=${searchQuery}`);
      if (response.data.error) {
        setSearchError(response.data.error);
        setSearchResults([]);
      } else {
        setSearchResults(response.data);
      }
    } catch (err: any) {
      console.error('Search failed', err);
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAsset = async (asset: any) => {
    setSelectedAsset(asset);
    setFormData({
      ...formData,
      assetName: asset.name,
      symbol: asset.symbol,
      currency: asset.currency || 'USD',
      assetType: mapAssetType(asset.type)
    });
    setModalStep(3);

    // Fetch current price
    try {
      setFetchingPrice(true);
      const encodedSymbol = encodeURIComponent(asset.symbol);
      const priceRes = await api.get(`/api/market/price/${encodedSymbol}?type=${asset.type}&currency=${asset.currency}`);
      if (priceRes.data.price) {
        setFormData(prev => ({
          ...prev,
          buyPrice: priceRes.data.price,
          currentValue: priceRes.data.price
        }));
        setInputValues(prev => ({
          ...prev,
          buyPrice: priceRes.data.price.toString()
        }));
      }
    } catch (err) {
      console.error('Failed to fetch price', err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const mapAssetType = (avType: string): any => {
    const t = avType.toLowerCase();
    if (t.includes('stock') || t.includes('equity')) return 'stocks';
    if (t.includes('crypto') || t.includes('digital currency')) return 'crypto';
    if (t.includes('forex')) return 'forex';
    return 'other';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/investments/${formData.id}`, formData);
        toast.success(t('investment_updated'));
      } else {
        await api.post('/investments', formData);
        toast.success(t('investment_added'));
      }
      setShowModal(false);
      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Failed to save investment');
    }
  };

  const handleCloseInvestment = async () => {
    try {
      await api.put(`/investments/${formData.id}/close`, {
        sellPrice: formData.sellPrice,
        closeDate: formData.closeDate
      });
      toast.success(t('investment_closed'));
      setShowModal(false);
      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error('Close failed', err);
      toast.error('Failed to close investment');
    }
  };

  const handleRefreshPrices = async () => {
    setLoading(true);
    for (const inv of activeInvestments) {
      if (inv.symbol && inv.assetType !== 'manual') {
        try {
          const priceRes = await api.get(`/api/market/price/${inv.symbol}?type=${inv.assetType}&currency=${inv.currency}`);
          if (priceRes.data.price) {
            await api.put(`/investments/${inv.id}`, { currentValue: priceRes.data.price });
          }
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error(`Failed to refresh ${inv.symbol}`, err);
        }
      }
    }
    await fetchInvestments();
    setLoading(false);
    toast.success(t('prices_updated'));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/investments/${id}`);
      toast.success(t('investment_deleted'));
      fetchInvestments();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete investment');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      assetName: '',
      assetType: 'stocks',
      symbol: '',
      quantity: 1,
      buyPrice: 0,
      currentValue: 0,
      currency: 'USD',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      sellPrice: 0,
      closeDate: new Date().toISOString().split('T')[0],
    });
    setInputValues({
      quantity: '1',
      buyPrice: '0',
      sellPrice: '0'
    });
    setModalStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAsset(null);
    setIsClosing(false);
  };

  const formatAmount = (amount: number, currencyCode: string = baseCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const filteredInvestments = investments.filter(inv => {
    const matchesStatus = filter === 'all' || inv.status === filter;
    const matchesType = typeFilter === 'all' || inv.assetType === typeFilter;
    return matchesStatus && matchesType;
  });

  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.initialAmount, 0);
  const currentMarketValue = activeInvestments.reduce((sum, i) => sum + (i.currentValue * i.quantity), 0);
  const totalPL = currentMarketValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const pieData = [
    { name: t('stocks'), value: investments.filter(i => i.assetType === 'stocks').reduce((sum, i) => sum + i.currentValue * i.quantity, 0) },
    { name: t('crypto'), value: investments.filter(i => i.assetType === 'crypto').reduce((sum, i) => sum + i.currentValue * i.quantity, 0) },
    { name: t('forex'), value: investments.filter(i => i.assetType === 'forex').reduce((sum, i) => sum + i.currentValue * i.quantity, 0) },
    { name: t('other'), value: investments.filter(i => !['stocks', 'crypto', 'forex'].includes(i.assetType)).reduce((sum, i) => sum + i.currentValue * i.quantity, 0) },
  ].filter(d => d.value > 0);

  const performanceTrend = [
    { name: 'Start', value: totalInvested },
    { name: 'Current', value: currentMarketValue }
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary dark:text-white">
            {t('investments')}
          </h1>
          <p className="text-textSecondary dark:text-gray-400 mt-1">{t('portfolio_dist')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={handleRefreshPrices}
            disabled={loading}
            variant="secondary"
            className="flex-1 md:flex-none"
            icon={loading ? 'sync' : 'sync'}
            isLoading={loading}
          >
            {t('update_price')}
          </Button>
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            variant="primary"
            className="flex-1 md:flex-none"
            icon="add"
          >
            {t('add_investment')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'capital_invested', value: formatAmount(totalInvested), color: 'text-textPrimary dark:text-white', icon: 'account_balance_wallet', bg: 'bg-primary/10 text-primary' },
          { label: 'market_value', value: formatAmount(currentMarketValue), color: 'text-primary', icon: 'monitoring', bg: 'bg-blue-500/10 text-blue-500' },
          { label: 'profit_loss', value: `${totalPL >= 0 ? '+' : ''}${formatAmount(totalPL)}`, color: totalPL >= 0 ? 'text-success' : 'text-error', icon: totalPL >= 0 ? 'trending_up' : 'trending_down', bg: totalPL >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error' },
          { label: 'roi', value: `${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`, color: totalROI >= 0 ? 'text-success' : 'text-error', icon: 'percent', bg: totalROI >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 flex items-center gap-4">
            <div className={`size-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
            <div>
              <p className="text-textSecondary dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{t(stat.label)}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('asset_performance')}</h3>
          <div className="h-[300px]">
            {performanceTrend.length > 0 ? (
              <FinoraLineChart data={performanceTrend} dataKeys={['value']} />
            ) : (
              <div className="flex items-center justify-center h-full text-textSecondary">{t('no_data')}</div>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6 text-textPrimary dark:text-white">{t('portfolio_dist')}</h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <FinoraPieChart data={pieData} nameKey="name" valueKey="value" />
            ) : (
              <div className="flex items-center justify-center h-full text-textSecondary">{t('no_data')}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Filters & List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            {(['all', 'active', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === s ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-textSecondary dark:text-gray-400'}`}
              >
                {t(s)}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-textPrimary dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <option value="all">{t('all')}</option>
            <option value="stocks">{t('stocks')}</option>
            <option value="crypto">{t('crypto')}</option>
            <option value="forex">{t('forex')}</option>
            <option value="manual">{t('manual_asset')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-textSecondary dark:text-gray-400 uppercase font-bold text-[11px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start pl-8">{t('name')}</th>
                <th className="px-6 py-4 text-start">{t('ticker')}</th>
                <th className="px-6 py-4 text-start">{t('buy_price')}</th>
                <th className="px-6 py-4 text-start">{t('market_price')}</th>
                <th className="px-6 py-4 text-start">{t('profit_loss')}</th>
                <th className="px-6 py-4 text-end pr-8">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-textSecondary dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl opacity-50">money_off</span>
                      <p className="font-medium">{t('no_records_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => {
                  let rowClass = "group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";
                  // Add subtle border for closed/profit/loss visual
                  const profitClass = inv.profitLoss >= 0 ? "text-success" : "text-error";

                  return (
                    <tr key={inv.id} className={rowClass}>
                      <td className="px-6 py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${inv.status === 'closed' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {inv.assetType === 'crypto' ? 'currency_bitcoin' : inv.assetType === 'forex' ? 'currency_exchange' : inv.assetType === 'stocks' ? 'show_chart' : 'category'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-textPrimary dark:text-white text-base">{inv.assetName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-textSecondary dark:text-gray-400 font-bold uppercase tracking-wider">{t(inv.assetType)}</p>
                              {inv.status === 'closed' && <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] rounded font-bold text-gray-500">CLOSED</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-textSecondary dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          {inv.symbol || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-textPrimary dark:text-white">{formatAmount(inv.buyPrice, inv.currency)}</p>
                        <p className="text-[11px] text-textSecondary dark:text-gray-400 font-medium">× {inv.quantity}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-primary">{formatAmount(inv.currentValue, inv.currency)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`text-sm font-bold ${profitClass}`}>
                          {inv.profitLoss >= 0 ? '+' : ''}{formatAmount(inv.profitLoss, inv.currency)}
                        </p>
                        <p className={`text-[11px] font-bold ${inv.roi >= 0 ? 'text-success' : 'text-error'}`}>
                          {inv.roi >= 0 ? '+' : ''}{inv.roi.toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-6 py-5 pr-8">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {inv.status === 'active' && (
                            <button
                              onClick={() => {
                                setFormData({ ...formData, id: inv.id, assetName: inv.assetName, sellPrice: inv.currentValue });
                                setInputValues({ ...inputValues, sellPrice: inv.currentValue.toString() });
                                setIsClosing(true);
                                setShowModal(true);
                              }}
                              className="size-9 rounded-xl flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/20 text-textSecondary dark:text-gray-400 hover:text-orange-500 transition-colors"
                              title={t('close_investment')}
                            >
                              <span className="material-symbols-outlined text-[18px]">lock</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="size-9 rounded-xl flex items-center justify-center hover:bg-error/10 text-textSecondary dark:text-gray-400 hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <Card className="w-full max-w-lg z-10 animate-scale-up overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e?.stopPropagation()}>
            {isClosing ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <h3 className="text-xl font-bold text-textPrimary dark:text-white">{t('close_investment')}</h3>
                  <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">{formData.assetName}</p>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto">
                  <div>
                    <label className="text-xs font-bold uppercase text-textSecondary mb-2 block">{t('sell_price')}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      lang="en"
                      value={inputValues.sellPrice}
                      onChange={(e) => {
                        let value = e.target.value;
                        value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                        value = value.replace(/[^0-9.]/g, '');
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setInputValues({ ...inputValues, sellPrice: value });
                        const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                        setFormData({ ...formData, sellPrice: numValue });
                      }}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                      style={{ direction: 'ltr' }}
                    />
                  </div>

                  <Input
                    label={t('sell_date')}
                    type="date"
                    value={formData.closeDate}
                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                  />
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex gap-3">
                  <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">{t('cancel')}</Button>
                  <Button variant="primary" onClick={handleCloseInvestment} className="flex-1">{t('save')}</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                  <h3 className="text-xl font-bold text-textPrimary dark:text-white">{t('add_investment')}</h3>
                  <button onClick={() => setShowModal(false)} className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Steps */}
                <div className="px-6 pt-4 pb-2">
                  <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${modalStep >= s ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {modalStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-textSecondary dark:text-gray-400 mb-4 uppercase tracking-wider">{t('select_market')}</p>
                      {(['stocks', 'crypto', 'forex', 'manual'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFormData({ ...formData, assetType: type });
                            if (type === 'manual') setModalStep(3); else setModalStep(2);
                          }}
                          className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group bg-white dark:bg-gray-800/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-textSecondary dark:text-gray-400 group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-2xl">
                                {type === 'stocks' ? 'show_chart' : type === 'crypto' ? 'currency_bitcoin' : type === 'forex' ? 'currency_exchange' : 'edit_square'}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="block font-bold text-textPrimary dark:text-white text-lg">{t(type === 'manual' ? 'manual_asset' : type)}</span>
                              <span className="text-xs text-textSecondary dark:text-gray-400">
                                {type === 'manual' ? 'Custom Entry' : `Search ${type} market`}
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-gray-300 group-hover:text-primary">navigate_next</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {modalStep === 2 && (
                    <div className="space-y-5">
                      {/* Search Bar */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            autoFocus
                            type="text"
                            placeholder={t('search_asset')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-textPrimary dark:text-white"
                          />
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">search</span>
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={searching}
                          isLoading={searching}
                          icon="search"
                        >
                          {t('search')}
                        </Button>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {searchError && (
                          <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs">
                            <p className="font-bold mb-1">Search Error:</p>
                            <p>{searchError}</p>
                          </div>
                        )}

                        {searchResults.map((asset, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAsset(asset)}
                            className="w-full p-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-start transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm text-textPrimary dark:text-white uppercase">{asset.symbol}</p>
                                <p className="text-xs text-textSecondary dark:text-gray-400 truncate max-w-[200px]">{asset.name}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-textSecondary dark:text-gray-400 font-bold">{asset.type}</span>
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* Quick Select for Crypto/Forex */}
                        {(formData.assetType === 'crypto' || formData.assetType === 'forex') && !searchQuery && (
                          <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black uppercase text-textSecondary tracking-widest">
                              {formData.assetType === 'crypto' ? 'Popular Cryptocurrencies' : 'Popular Forex Pairs'}
                            </p>
                            {loadingAssets ? (
                              <div className="flex justify-center"><span className="animate-spin material-symbols-outlined text-gray-300">progress_activity</span></div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {(formData.assetType === 'crypto' ? supportedCryptos : supportedForex)
                                  .slice(0, 10)
                                  .map((asset: any) => (
                                    <button
                                      key={asset.symbol}
                                      type="button"
                                      onClick={() => handleSelectAsset({
                                        symbol: asset.symbol,
                                        name: asset.name,
                                        type: formData.assetType === 'crypto' ? 'Digital Currency' : 'Forex',
                                        currency: asset.currency || 'USD'
                                      })}
                                      className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-primary/30 hover:bg-primary/5 text-xs font-bold text-textSecondary hover:text-primary transition-all text-left"
                                    >
                                      <div className="font-black text-textPrimary dark:text-white uppercase">{asset.symbol}</div>
                                      <div className="text-[10px] opacity-70 truncate">{asset.name}</div>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct Entry Option */}
                        {searchQuery.length >= 2 && !searching && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleSelectAsset({ symbol: searchQuery.toUpperCase(), name: searchQuery.toUpperCase(), type: formData.assetType === 'crypto' ? 'Digital Currency' : formData.assetType === 'forex' ? 'Forex' : 'Equity', currency: 'USD' })}
                              className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all text-start group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-textPrimary dark:text-white uppercase">Use "{searchQuery}" as symbol</p>
                                  <p className="text-[10px] text-textSecondary dark:text-gray-400">Proceed directly without search results</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setModalStep(1)} className="w-full text-xs text-textSecondary font-bold hover:text-primary transition-all uppercase tracking-widest">{t('cancel')}</button>
                    </div>
                  )}

                  {modalStep === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {selectedAsset && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-primary shadow-sm">
                              <span className="material-symbols-outlined">
                                {formData.assetType === 'crypto' ? 'currency_bitcoin' : 'show_chart'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-textPrimary dark:text-white uppercase">{selectedAsset.symbol}</p>
                              <p className="text-xs text-textSecondary truncate max-w-[200px]">{selectedAsset.name}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setModalStep(2)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 text-[10px] font-bold uppercase text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors">Change</button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-textSecondary mb-2 block">{t('quantity')}</label>
                          <input
                            required
                            type="text"
                            inputMode="decimal"
                            lang="en"
                            value={inputValues.quantity}
                            onChange={(e) => {
                              let value = e.target.value;
                              value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                              value = value.replace(/[^0-9.]/g, '');
                              const parts = value.split('.');
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('');
                              }
                              setInputValues({ ...inputValues, quantity: value });
                              const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                              setFormData({ ...formData, quantity: numValue });
                            }}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg text-textPrimary dark:text-white"
                            style={{ direction: 'ltr' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-textSecondary mb-2 block">{t('buy_price')}</label>
                          <div className="relative">
                            <input
                              required
                              type="text"
                              inputMode="decimal"
                              lang="en"
                              value={inputValues.buyPrice}
                              onChange={(e) => {
                                let value = e.target.value;
                                value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                                value = value.replace(/[^0-9.]/g, '');
                                const parts = value.split('.');
                                if (parts.length > 2) {
                                  value = parts[0] + '.' + parts.slice(1).join('');
                                }
                                setInputValues({ ...inputValues, buyPrice: value });
                                const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                                setFormData({ ...formData, buyPrice: numValue, currentValue: numValue });
                              }}
                              className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg text-textPrimary dark:text-white"
                              style={{ direction: 'ltr' }}
                            />
                            {fetchingPrice && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary animate-pulse font-bold bg-primary/10 px-2 py-0.5 rounded">
                                ADJUSTING...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Currency Selector for Crypto/Forex */}
                      {(formData.assetType === 'crypto' || formData.assetType === 'forex') && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-textSecondary">{t('currency')}</label>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-primary transition-all font-bold text-textPrimary dark:text-white appearance-none cursor-pointer"
                          >
                            {['USD', 'ILS', 'JOD', 'SAR', 'AED', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'].map(c =>
                              <option key={c} value={c}>{c}</option>
                            )}
                          </select>
                        </div>
                      )}

                      {formData.assetType === 'manual' && (
                        <Input
                          label={t('name')}
                          required
                          value={formData.assetName}
                          onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                        />
                      )}

                      <Input
                        label={t('purchase_date')}
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      />

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-textSecondary">{t('notes')}</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium min-h-[80px] text-textPrimary dark:text-white"
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button type="button" variant="ghost" onClick={() => setModalStep(selectedAsset ? 2 : 1)} className="flex-1">{t('back')}</Button>
                        <Button type="submit" variant="primary" className="flex-[2]">{t('save')}</Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Investments;
