import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';
import { FinoraLineChart, FinoraPieChart } from '../components/charts/ChartWrappers';

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
  const { currency: baseCurrency, language } = useAppStore();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // State للقيم النصية (للسماح بكتابة الفاصلة)
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
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch investments');
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
      } else {
        await api.post('/investments', formData);
      }
      setShowModal(false);
      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleCloseInvestment = async () => {
    try {
      await api.put(`/investments/${formData.id}/close`, {
        sellPrice: formData.sellPrice,
        closeDate: formData.closeDate
      });
      setShowModal(false);
      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error('Close failed', err);
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
          // Respect Alpha Vantage rate limit (5 calls per minute for free tier)
          // We'll wait 1 second between calls to avoid immediate hammering,
          // but real rate limiting should be smarter.
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error(`Failed to refresh ${inv.symbol}`, err);
        }
      }
    }
    await fetchInvestments();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/investments/${id}`);
      fetchInvestments();
    } catch (err) {
      console.error('Delete failed', err);
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
    // Always use English numbers as requested
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

  // Summary Calculations
  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.initialAmount, 0);
  const currentMarketValue = activeInvestments.reduce((sum, i) => sum + (i.currentValue * i.quantity), 0);
  const totalPL = currentMarketValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Charts Data
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            {t('investments')}
          </h1>
          <p className="text-slate-400 mt-1">{t('portfolio_dist')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleRefreshPrices}
            disabled={loading}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-surface dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
            {t('update_price')}
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >    <span className="material-symbols-outlined">add</span>
            {t('add_investment')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('capital_invested')}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatAmount(totalInvested)}</p>
        </div>
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('market_value')}</p>
          <p className="text-2xl font-black text-primary mt-1">{formatAmount(currentMarketValue)}</p>
        </div>
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('profit_loss')}</p>
          <p className={`text-2xl font-black mt-1 ${totalPL >= 0 ? 'text-success' : 'text-red-500'}`}>
            {totalPL >= 0 ? '+' : ''}{formatAmount(totalPL)}
          </p>
        </div>
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('roi')}</p>
          <p className={`text-2xl font-black mt-1 ${totalROI >= 0 ? 'text-success' : 'text-red-500'}`}>
            {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6">{t('asset_performance')}</h3>
          <div className="h-[300px]">
            <FinoraLineChart data={performanceTrend} dataKeys={['value']} />
          </div>
        </div>
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-card shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6">{t('portfolio_dist')}</h3>
          <div className="h-[300px]">
            <FinoraPieChart data={pieData} nameKey="name" valueKey="value" />
          </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {(['all', 'active', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === s ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
              >
                {t(s)}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
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
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-start">{t('name')}</th>
                <th className="px-6 py-4 text-start">{t('ticker')}</th>
                <th className="px-6 py-4 text-start">{t('buy_price')}</th>
                <th className="px-6 py-4 text-start">{t('market_price')}</th>
                <th className="px-6 py-4 text-start">{t('profit_loss')}</th>
                <th className="px-6 py-4 text-end">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    {t('no_records_found')}
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => {
                  let rowClass = "group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
                  if (inv.status === 'closed') {
                    rowClass = inv.profitLoss >= 0
                      ? "group bg-green-50/60 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border-l-4 border-green-500"
                      : "group bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border-l-4 border-red-500";
                  } else {
                    rowClass += " border-l-4 border-transparent";
                  }

                  return (
                    <tr key={inv.id} className={rowClass}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-white">{inv.assetName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold tracking-wider">{t(inv.assetType)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-[10px] font-black text-slate-500">
                          {inv.symbol || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{formatAmount(inv.buyPrice, inv.currency)}</p>
                        <p className="text-[10px] text-slate-400" lang="en">× {inv.quantity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-primary">{formatAmount(inv.currentValue, inv.currency)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm font-bold ${inv.profitLoss >= 0 ? 'text-success' : 'text-red-500'}`}>
                          {inv.profitLoss >= 0 ? '+' : ''}{formatAmount(inv.profitLoss, inv.currency)}
                        </p>
                        <p className={`text-[10px] font-bold ${inv.roi >= 0 ? 'text-success' : 'text-red-500'}`}>
                          {inv.roi >= 0 ? '+' : ''}{inv.roi.toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex justify-end gap-2">
                          {inv.status === 'active' && (
                            <button
                              onClick={() => {
                                setFormData({ ...formData, id: inv.id, assetName: inv.assetName, sellPrice: inv.currentValue });
                                setInputValues({ ...inputValues, sellPrice: inv.currentValue.toString() });
                                setIsClosing(true);
                                setShowModal(true);
                              }}
                              className="size-9 rounded-xl flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                              title={t('close_investment')}
                            >
                              <span className="material-symbols-outlined text-[18px]">lock</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="size-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="bg-surface dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-10 animate-slide-up overflow-hidden border border-slate-200 dark:border-slate-700">
            {isClosing ? (
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold">{t('close_investment')}</h3>
                <p className="text-sm text-slate-400">{formData.assetName}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">{t('sell_price')}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      lang="en"
                      value={inputValues.sellPrice}
                      onChange={(e) => {
                        let value = e.target.value;
                        // تحويل الأرقام العربية إلى إنجليزية
                        value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                        // السماح فقط بالأرقام والفاصلة
                        value = value.replace(/[^0-9.]/g, '');
                        // السماح بفاصلة واحدة فقط
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setInputValues({ ...inputValues, sellPrice: value });
                        const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                        setFormData({ ...formData, sellPrice: numValue });
                      }}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">{t('sell_date')}</label>
                    <input
                      type="date"
                      value={formData.closeDate}
                      onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">{t('cancel')}</button>
                  <button onClick={handleCloseInvestment} className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">{t('save')}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('add_investment')}</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-all">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  {/* Steps Indicator */}
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${modalStep >= s ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {modalStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-400 mb-4">{t('select_market')}</p>
                      {(['stocks', 'crypto', 'forex', 'manual'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFormData({ ...formData, assetType: type });
                            if (type === 'manual') setModalStep(3); else setModalStep(2);
                          }}
                          className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined">
                                {type === 'stocks' ? 'show_chart' : type === 'crypto' ? 'currency_bitcoin' : type === 'forex' ? 'currency_exchange' : 'edit_square'}
                              </span>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{t(type === 'manual' ? 'manual_asset' : type)}</span>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">navigate_next</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {modalStep === 2 && (
                    <div className="space-y-4">
                      {/* Quick Select for Crypto/Forex */}
                      {(formData.assetType === 'crypto' || formData.assetType === 'forex') && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {formData.assetType === 'crypto' ? 'Popular Cryptocurrencies' : 'Popular Forex Pairs'}
                          </p>
                          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2 thin-scrollbar">
                            {loadingAssets ? (
                              <div className="text-center py-4 text-slate-400 text-sm">Loading...</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {(formData.assetType === 'crypto' ? supportedCryptos : supportedForex)
                                  .slice(0, 20)
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
                                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all text-left"
                                    >
                                      <div className="font-black">{asset.symbol}</div>
                                      <div className="text-[10px] opacity-70 truncate">{asset.name}</div>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            autoFocus
                            type="text"
                            placeholder={t('search_asset')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full h-12 px-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                          />
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        </div>
                        <button
                          onClick={handleSearch}
                          disabled={searching}
                          className="h-12 px-6 rounded-xl bg-primary text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          {searching ? (
                            <>
                              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                              <span>...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px]">search</span>
                              <span>{t('search_asset')}</span>
                            </>
                          )}
                        </button>
                      </div>


                      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 thin-scrollbar">
                        {searchError && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-500 text-xs">
                            <p className="font-bold mb-1">Search Error:</p>
                            <p>{searchError}</p>
                            <p className="mt-2 text-[10px] opacity-70">Hint: Check your ALPHA_VANTAGE_API_KEY in .env file.</p>
                          </div>
                        )}
                        {searchResults.map((asset, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAsset(asset)}
                            className="w-full p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-start transition-all"
                          >
                            <p className="font-bold text-sm text-slate-800 dark:text-white uppercase">{asset.symbol}</p>
                            <p className="text-xs text-slate-400 truncate">{asset.name}</p>
                            <p className="text-[10px] text-primary/60 font-medium">Market: {asset.type} • {asset.region}</p>
                          </button>
                        ))}

                        {/* Direct Entry Option */}
                        {searchQuery.length >= 2 && !searching && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleSelectAsset({ symbol: searchQuery.toUpperCase(), name: searchQuery.toUpperCase(), type: formData.assetType === 'crypto' ? 'Digital Currency' : formData.assetType === 'forex' ? 'Forex' : 'Equity', currency: 'USD' })}
                              className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-start group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase">Use "{searchQuery}" as symbol</p>
                                  <p className="text-[10px] text-slate-400">Proceed directly</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}

                        {searchQuery && !searching && searchResults.length === 0 && !searchError && (
                          <div className="p-6 text-center">
                            <p className="text-slate-400 italic text-sm">{t('no_records_found')}</p>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setModalStep(1)} className="w-full text-xs text-slate-400 font-bold hover:text-primary transition-all uppercase tracking-widest">{t('cancel')}</button>
                    </div>
                  )}

                  {modalStep === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {selectedAsset && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-black text-primary uppercase">{selectedAsset.symbol}</p>
                            <p className="text-xs text-slate-500 font-medium">{selectedAsset.name}</p>
                          </div>
                          <button type="button" onClick={() => setModalStep(2)} className="text-[10px] font-black uppercase text-primary underline">Change</button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400">{t('quantity')}</label>
                          <input
                            required
                            type="text"
                            inputMode="decimal"
                            lang="en"
                            value={inputValues.quantity}
                            onChange={(e) => {
                              let value = e.target.value;
                              // تحويل الأرقام العربية إلى إنجليزية
                              value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                              // السماح فقط بالأرقام والفاصلة
                              value = value.replace(/[^0-9.]/g, '');
                              // السماح بفاصلة واحدة فقط
                              const parts = value.split('.');
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('');
                              }
                              setInputValues({ ...inputValues, quantity: value });
                              const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                              setFormData({ ...formData, quantity: numValue });
                            }}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                            style={{ direction: 'ltr' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400">{t('buy_price')}</label>
                          <div className="relative">
                            <input
                              required
                              type="text"
                              inputMode="decimal"
                              lang="en"
                              value={inputValues.buyPrice}
                              onChange={(e) => {
                                let value = e.target.value;
                                // تحويل الأرقام العربية إلى إنجليزية
                                value = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                                // السماح فقط بالأرقام والفاصلة
                                value = value.replace(/[^0-9.]/g, '');
                                // السماح بفاصلة واحدة فقط
                                const parts = value.split('.');
                                if (parts.length > 2) {
                                  value = parts[0] + '.' + parts.slice(1).join('');
                                }
                                setInputValues({ ...inputValues, buyPrice: value });
                                const numValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                                setFormData({ ...formData, buyPrice: numValue, currentValue: numValue });
                              }}
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                              style={{ direction: 'ltr' }}
                            />
                            {fetchingPrice && <span className="absolute right-3 top-3 text-[10px] text-primary animate-pulse font-bold">FETCHING...</span>}
                          </div>
                        </div>
                      </div>

                      {/* Currency Selector for Crypto/Forex */}
                      {(formData.assetType === 'crypto' || formData.assetType === 'forex') && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400">{t('currency')}</label>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="ILS">ILS - Israeli Shekel</option>
                            <option value="JOD">JOD - Jordanian Dinar</option>
                            <option value="SAR">SAR - Saudi Riyal</option>
                            <option value="AED">AED - UAE Dirham</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="CHF">CHF - Swiss Franc</option>
                          </select>
                        </div>
                      )}

                      {formData.assetType === 'manual' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400">{t('name')}</label>
                          <input
                            required
                            type="text"
                            value={formData.assetName}
                            onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-medium"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">{t('purchase_date')}</label>
                        <input
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">{t('notes')}</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-primary transition-all font-medium min-h-[80px]"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setModalStep(selectedAsset ? 2 : 1)} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">{t('back')}</button>
                        <button type="submit" className="flex-[2] h-12 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">{t('save')}</button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
