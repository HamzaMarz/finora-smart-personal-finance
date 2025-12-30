import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

const CurrencySettings = () => {
  const { t } = useTranslation();
  const { user, login } = useAuthStore();
  const { setCurrency } = useAppStore();
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editRate, setEditRate] = useState<{ code: string, rate: string } | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/rates');
      if (Array.isArray(res.data)) {
        setRates(res.data);
      } else {
        console.error('Expected array of rates, got:', res.data);
        setRates([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch rates', err);
      // If we get a 401, the interceptor will handle redirect
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/api/rates/sync');
      if (res.data.success && Array.isArray(res.data.rates)) {
        setRates(res.data.rates);
        alert(t('sync_success'));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      alert(err.message || t('sync_failed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateBaseCurrency = async (currency: string) => {
    try {
      // Send only the necessary fields to avoid potential serialization issues
      await api.put('/user/profile', {
        name: user?.name,
        avatar: user?.avatar,
        baseCurrency: currency
      });

      // Update local store
      const authState = useAuthStore.getState();
      if (user) {
        login({ ...user, baseCurrency: currency }, authState.token || '');
        setCurrency(currency);
        alert(t('update_base_success', { currency }));

        // RE-FETCH rates immediately so the table updates to the new base
        fetchRates();
      }
    } catch (err) {
      console.error(err);
      alert(t('update_base_failed'));
    }
  };

  const saveRate = async () => {
    if (!editRate) return;
    try {
      await api.put(`/api/rates/${editRate.code}`, { rate: parseFloat(editRate.rate) });
      setEditRate(null);
      fetchRates();
    } catch (err) {
      alert(t('update_rate_failed'));
    }
  };

  return (
    <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">{t('currency_settings')}</h3>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 text-sm text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
          {syncing ? t('syncing_dots') : t('sync_rates')}
        </button>
      </div>

      <div className="space-y-6">
        {/* Base Currency */}
        <div>
          <label className="block text-sm font-bold mb-2">{t('base_currency')}</label>
          <select
            value={user?.baseCurrency || 'USD'}
            onChange={(e) => handleUpdateBaseCurrency(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="JPY">JPY (¥) - Japanese Yen</option>
            <option value="GBP">GBP (£)</option>
            <option value="AUD">AUD ($) - Australian Dollar</option>
            <option value="ILS">ILS (₪) - Shekel</option>
            <option value="JOD">JOD (د.أ) - Jordanian Dinar</option>
            <option value="KWD">KWD (د.ك) - Kuwaiti Dinar</option>
            <option value="BHD">BHD (د.ب) - Bahraini Dinar</option>
            <option value="OMR">OMR (ر.ع) - Omani Rial</option>
            <option value="QAR">QAR (ر.ق) - Qatari Rial</option>
            <option value="SAR">SAR (﷼) - Saudi Rial</option>
            <option value="AED">AED (د.إ) - UAE Dirham</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">{t('all_data_converted')}</p>
        </div>

        {/* Exchange Rates Table */}
        <div>
          <label className="block text-sm font-bold mb-2">{t('exchange_rate')} ({t('base_currency')}: {user?.baseCurrency || 'USD'})</label>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3">{t('currency')}</th>
                  <th className="px-4 py-3">{t('exchange_rate')}</th>
                  <th className="px-4 py-3">{t('last_updated')}</th>
                  <th className="px-4 py-3">{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(rates) || rates.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t('no_rates_available')}</td></tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.currencyCode} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-bold">{rate.currencyCode}</td>
                      <td className="px-4 py-3">
                        {editRate?.code === rate.currencyCode ? (
                          <input
                            lang="en"
                            type="number"
                            value={editRate.rate}
                            onChange={(e) => setEditRate({ ...editRate, rate: e.target.value })}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span>{rate.rate.toFixed(4)}</span>
                            {rate.rate !== 0 && rate.currencyCode !== (user?.baseCurrency || 'USD') && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                1 {rate.currencyCode} = {(1 / rate.rate).toFixed(4)} {(user?.baseCurrency || 'USD')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(rate.lastUpdated).toLocaleString()}
                        {rate.isManual && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full">{t('manual')}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {editRate?.code === rate.currencyCode ? (
                          <div className="flex items-center gap-2">
                            <button onClick={saveRate} className="text-green-600 hover:text-green-700"><span className="material-symbols-outlined text-[18px]">check</span></button>
                            <button onClick={() => setEditRate(null)} className="text-red-500 hover:text-red-600"><span className="material-symbols-outlined text-[18px]">close</span></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditRate({ code: rate.currencyCode, rate: rate.rate.toString() })} className="text-primary hover:text-primary/80">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage, aiEnabled, setAiEnabled } = useAppStore();
  const { user, logout, login } = useAuthStore();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    bio: '',
    avatar: user?.avatar || '',
    savingsPercentage: user?.savingsPercentage || 0,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [encPass, setEncPass] = useState('');

  // Avatar modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAvatar = () => {
    if (avatarUrl) {
      setProfileData({ ...profileData, avatar: avatarUrl });
      setShowAvatarModal(false);
      setAvatarUrl('');
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await api.put('/user/profile', profileData);
      setProfileMessage({ type: 'success', text: t('save_profile_success') });

      // Get current auth state
      const authState = useAuthStore.getState();

      // Update user in auth store with current token
      login({
        ...user!,
        name: profileData.name,
        avatar: profileData.avatar,
        savingsPercentage: profileData.savingsPercentage,
      }, authState.token || '');

      setProfileMessage({ type: 'success', text: t('save_profile_success') });
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || t('save_profile_failed') });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'ar') => {
    setLanguage(newLang);
    if (user) {
      try {
        await api.put('/user/profile', { language: newLang });
        // Update user in auth store 
        login({ ...user, language: newLang }, useAuthStore.getState().token || '');
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const generateAvatar = () => {
    const seed = profileData.name || user?.email || 'default';
    setProfileData({ ...profileData, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-bold">{t('settings')}</h2>
        <p className="text-slate-400 mt-1">{t('settings_intro')}</p>
      </div>

      {/* Profile Section */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">{t('profile')}</h3>
          {!isEditingProfile && (
            <button
              onClick={() => {
                setIsEditingProfile(true);
                setProfileData({
                  name: user?.name || '',
                  phone: '',
                  bio: '',
                  avatar: user?.avatar || '',
                  savingsPercentage: user?.savingsPercentage || 0,
                });
              }}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              {t('edit')}
            </button>
          )}
        </div>

        {profileMessage && (
          <div className={`mb-4 p-3 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {profileMessage.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <img
              src={isEditingProfile ? profileData.avatar : user?.avatar}
              alt="Avatar"
              className="size-20 rounded-full ring-4 ring-primary/20"
            />
            {isEditingProfile && (
              <button
                onClick={() => setShowAvatarModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                {t('change_avatar')}
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('name')}</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('full_name')}
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-400">{user?.name}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('email')}</label>
            <p className="text-slate-600 dark:text-slate-400">{user?.email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('phone')}</label>
            {isEditingProfile ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 234 567 8900"
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-400">{profileData.phone || t('not_set')}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('bio')}</label>
            {isEditingProfile ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="..."
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-400">{profileData.bio || t('no_bio')}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditingProfile && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? t('saving_dots') : t('save_changes')}
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileMessage(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Savings Settings */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-6">{t('savings_percentage')}</h3>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">{t('savings_percentage_hint')}</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={profileData.savingsPercentage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setProfileData({ ...profileData, savingsPercentage: val });
                  if (!isEditingProfile) {
                    // Trigger save immediately if not in full edit mode
                    api.put('/user/profile', { savingsPercentage: val });
                    login({ ...user!, savingsPercentage: val }, useAuthStore.getState().token || '');
                  }
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="size-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
              {profileData.savingsPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-6">{t('general_settings')}</h3>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('language')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('ar')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${language === 'ar' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('theme')}</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="light">{t('theme_light')}</option>
              <option value="dark">{t('theme_dark')}</option>
              <option value="system">{t('theme_system')}</option>
            </select>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{t('ai_insights')}</p>
              <p className="text-sm text-slate-400">{t('ai_insights_hint')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <CurrencySettings />

      {/* Logout */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <button
          onClick={logout}
          className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          {t('logout')}
        </button>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Change Avatar</h3>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarUrl('');
                }}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <img
                src={avatarUrl || profileData.avatar || user?.avatar}
                alt="Preview"
                className="size-32 rounded-full ring-4 ring-primary/20"
              />
            </div>

            {/* Upload from device */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Upload from Device</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {uploadingImage && (
                <p className="text-xs text-slate-400 mt-1">Uploading...</p>
              )}
            </div>

            {/* URL Input */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Or Enter Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Generate Random */}
            <button
              onClick={() => {
                const seed = Math.random().toString(36).substring(7);
                setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
              }}
              className="w-full mb-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Generate Random Avatar
            </button>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={applyAvatar}
                disabled={!avatarUrl}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarUrl('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
