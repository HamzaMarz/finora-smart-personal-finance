import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { backupService } from '../services/ClientBackupService';

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
        setRates([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch rates', err);
      if (err.response?.status !== 401) toast.error('Failed to load exchange rates');
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
        toast.success(t('sync_success'));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      toast.error(err.message || t('sync_failed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateBaseCurrency = async (currency: string) => {
    try {
      await api.put('/user/profile', {
        name: user?.name,
        avatar: user?.avatar,
        baseCurrency: currency
      });

      const authState = useAuthStore.getState();
      if (user) {
        login({ ...user, baseCurrency: currency }, authState.token || '');
        setCurrency(currency);
        toast.success(t('update_base_success', { currency }));
        fetchRates();
      }
    } catch (err) {
      toast.error(t('update_base_failed'));
    }
  };

  const saveRate = async () => {
    if (!editRate) return;
    try {
      await api.put(`/api/rates/${editRate.code}`, { rate: parseFloat(editRate.rate) });
      setEditRate(null);
      fetchRates();
      toast.success('Rate updated');
    } catch (err) {
      toast.error(t('update_rate_failed'));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-textPrimary dark:text-white">{t('currency_settings')}</h3>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="ghost"
          isLoading={syncing}
          icon="sync"
          className="text-primary hover:bg-primary/10"
        >
          {t('sync_rates')}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('base_currency')}</label>
          <div className="relative">
            <select
              value={user?.baseCurrency || 'USD'}
              onChange={(e) => handleUpdateBaseCurrency(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-bold text-textPrimary dark:text-white"
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
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">expand_more</span>
          </div>
          <p className="text-xs text-textSecondary dark:text-gray-400 mt-2 font-medium bg-secondary/10 text-secondary px-3 py-1 rounded-lg inline-block">{t('all_data_converted')}</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">{t('exchange_rate')} ({t('base_currency')}: {user?.baseCurrency || 'USD'})</label>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-textSecondary dark:text-gray-400 uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">{t('currency')}</th>
                  <th className="px-6 py-4">{t('exchange_rate')}</th>
                  <th className="px-6 py-4">{t('last_updated')}</th>
                  <th className="px-6 py-4 text-end pr-6">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {!Array.isArray(rates) || rates.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-textSecondary dark:text-gray-400 font-medium">{t('no_rates_available')}</td></tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.currencyCode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-black text-textPrimary dark:text-white">{rate.currencyCode}</td>
                      <td className="px-6 py-4">
                        {editRate?.code === rate.currencyCode ? (
                          <input
                            autoFocus
                            lang="en"
                            type="number"
                            value={editRate.rate}
                            onChange={(e) => setEditRate({ ...editRate, rate: e.target.value })}
                            className="w-32 px-3 py-1.5 bg-white dark:bg-gray-900 border border-primary rounded-lg focus:outline-none ring-2 ring-primary/20 font-bold"
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-textPrimary dark:text-white">{rate.rate.toFixed(4)}</span>
                            {rate.rate !== 0 && rate.currencyCode !== (user?.baseCurrency || 'USD') && (
                              <span className="text-[10px] text-textSecondary dark:text-gray-400 font-bold opacity-70">
                                1 {rate.currencyCode} = {(1 / rate.rate).toFixed(4)} {(user?.baseCurrency || 'USD')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-textSecondary dark:text-gray-400 text-xs font-medium">
                        {new Date(rate.lastUpdated).toLocaleDateString()}
                        {rate.isManual && <span className="ml-2 px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-bold rounded uppercase tracking-wider">{t('manual')}</span>}
                      </td>
                      <td className="px-6 py-4 text-end pr-6">
                        {editRate?.code === rate.currencyCode ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={saveRate} className="size-8 rounded-lg bg-success/10 text-success hover:bg-success hover:text-white transition-all flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">check</span></button>
                            <button onClick={() => setEditRate(null)} className="size-8 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">close</span></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditRate({ code: rate.currencyCode, rate: rate.rate.toString() })} className="size-8 rounded-lg hover:bg-primary/10 text-textSecondary dark:text-gray-400 hover:text-primary transition-all flex items-center justify-center ml-auto">
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
    </Card>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, language, setLanguage, aiEnabled, setAiEnabled } = useAppStore();
  const { user, logout, login } = useAuthStore();

  // Backup State
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    bio: '',
    avatar: user?.avatar || '',
    savingsPercentage: user?.savingsPercentage || 0,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    try {
      await api.put('/user/profile', profileData);

      const authState = useAuthStore.getState();
      login({
        ...user!,
        name: profileData.name,
        avatar: profileData.avatar,
        savingsPercentage: profileData.savingsPercentage,
      }, authState.token || '');

      toast.success(t('save_profile_success'));
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || t('save_profile_failed'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'ar') => {
    setLanguage(newLang);
    if (user) {
      try {
        await api.put('/user/profile', { language: newLang });
        login({ ...user, language: newLang }, useAuthStore.getState().token || '');
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      await backupService.createBackup();
      toast.success(t('backup_success', 'Backup completed successfully'));
    } catch (error: any) {
      console.error(error);
      toast.error(t('backup_failed', 'Backup failed: ') + (error.message || 'Unknown error'));
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm(t('restore_confirm', 'Restoring will overwrite current data. Continue?'))) return;
    try {
      setRestoring(true);
      await backupService.restoreLatestBackup();
      toast.success(t('restore_success', 'Data restored successfully'));
    } catch (error: any) {
      console.error(error);
      toast.error(t('restore_failed', 'Restore failed: ') + (error.message || 'Unknown error'));
      setRestoring(false); // Only set false on error, success reloads page
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in relative">
      <div>
        <h2 className="text-2xl font-bold text-textPrimary dark:text-white">{t('settings')}</h2>
        <p className="text-textSecondary mt-1 dark:text-gray-400">{t('settings_intro')}</p>
      </div>

      {/* Backup & Restore Section */}
      <Card className="p-6 border-l-4 border-l-primary">
        <h3 className="font-bold text-lg mb-2 text-textPrimary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">cloud_sync</span>
          {t('backup_restore', 'Backup & Restore')}
        </h3>
        <p className="text-sm text-textSecondary dark:text-gray-400 mb-6">
          {t('backup_desc', 'Securely backup your data to Google Drive. Backups are encrypted.')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleBackup}
            isLoading={backingUp}
            disabled={restoring}
            icon="backup"
            variant="primary"
          >
            {t('backup_now', 'Backup Now')}
          </Button>
          <Button
            onClick={handleRestore}
            isLoading={restoring}
            disabled={backingUp}
            icon="restore"
            variant="outline"
          >
            {t('restore_cloud', 'Restore from Cloud')}
          </Button>
        </div>
      </Card>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-textPrimary dark:text-white">{t('profile')}</h3>
          {!isEditingProfile && (
            <Button
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
              variant="secondary"
              size="sm"
              icon="edit"
            >
              {t('edit')}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <img
                src={isEditingProfile ? profileData.avatar : user?.avatar}
                alt="Avatar"
                className="size-24 rounded-full border-4 border-gray-100 dark:border-gray-700 shadow-sm object-cover"
              />
              {isEditingProfile && (
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">camera_alt</span>
                </button>
              )}
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t('name')}
                    disabled={!isEditingProfile}
                    value={isEditingProfile ? profileData.name : user?.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label={t('email')}
                    disabled={true}
                    value={user?.email || ''}
                  />
                </div>
              </div>

              <div>
                <Input
                  label={t('phone')}
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? profileData.phone : (profileData.phone || t('not_set'))}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder={isEditingProfile ? "+1 234 567 8900" : ""}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('bio')}</label>
                <textarea
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? profileData.bio : (profileData.bio || t('no_bio'))}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-transparent resize-none transition-all outline-none font-medium text-textPrimary dark:text-white ${!isEditingProfile ? 'border-transparent px-0 py-0' : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                  rows={isEditingProfile ? 3 : 1}
                  placeholder={isEditingProfile ? "Tell us about yourself..." : ""}
                />
              </div>
            </div>
          </div>

          {isEditingProfile && (
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button onClick={() => setIsEditingProfile(false)} variant="ghost" className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveProfile} isLoading={isSavingProfile} variant="primary" className="flex-1">
                {t('save_changes')}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Savings Settings */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-6 text-textPrimary dark:text-white">{t('savings_percentage')}</h3>
        <div className="space-y-6">
          <p className="text-sm text-textSecondary dark:text-gray-400">{t('savings_percentage_hint')}</p>
          <div className="flex items-center gap-6">
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
                    api.put('/user/profile', { savingsPercentage: val });
                    login({ ...user!, savingsPercentage: val }, useAuthStore.getState().token || '');
                  }
                }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-textSecondary uppercase tracking-wider">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-sm">
              {profileData.savingsPercentage}%
            </div>
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-6 text-textPrimary dark:text-white">{t('general_settings')}</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">{t('language')}</label>
            <div className="flex gap-3">
              {(['en', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${language === lang ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-textSecondary hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {lang === 'en' ? 'English' : 'العربية'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('theme')}</label>
            <div className="relative">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-bold text-textPrimary dark:text-white"
              >
                <option value="light">{t('theme_light')}</option>
                <option value="dark">{t('theme_dark')}</option>
                <option value="system">{t('theme_system')}</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">expand_more</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-primary/20 transition-all">
            <div>
              <p className="font-bold text-textPrimary dark:text-white">{t('ai_insights')}</p>
              <p className="text-xs text-textSecondary dark:text-gray-400 mt-1">{t('ai_insights_hint')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Card>

      <CurrencySettings />

      <div className="flex justify-end">
        <Button
          onClick={logout}
          variant="danger"
          icon="logout"
          className="w-full sm:w-auto"
        >
          {t('logout')}
        </Button>
      </div>

      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md animate-scale-up" onClick={(e) => e?.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-textPrimary dark:text-white">Change Avatar</h3>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarUrl('');
                }}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-textSecondary">close</span>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-center mb-8">
                <img
                  src={avatarUrl || profileData.avatar || user?.avatar}
                  alt="Preview"
                  className="size-32 rounded-full border-4 border-primary/20 shadow-lg object-cover bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Upload from Device</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-textSecondary dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-primary mt-2 font-bold animate-pulse">Uploading...</p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-textSecondary">Or</span></div>
                </div>

                <Button
                  onClick={() => {
                    const seed = Math.random().toString(36).substring(7);
                    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
                  }}
                  variant="secondary"
                  fullWidth
                  icon="autorenew"
                >
                  Generate Random Avatar
                </Button>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setShowAvatarModal(false)} variant="ghost" fullWidth>Cancel</Button>
                  <Button onClick={applyAvatar} disabled={!avatarUrl} variant="primary" fullWidth>Apply</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
