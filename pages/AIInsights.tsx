import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { FinanceService } from '../services/finance.service';

const AIInsights: React.FC = () => {
    const { t } = useTranslation();
    const { aiEnabled, setAiEnabled } = useAppStore();
    const [insights, setInsights] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const fetchInsights = async () => {
        if (!aiEnabled) return;

        setLoading(true);
        try {
            const data = await FinanceService.getAiInsights();
            setInsights(data.insights);
        } catch (error) {
            console.error('Failed to fetch AI insights:', error);
            setInsights(t('unable_generate_insights'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aiEnabled) {
            fetchInsights();
        }
    }, [aiEnabled]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('ai_insights')}</h2>
                <p className="text-slate-400 mt-1">{t('ai_insights_desc')}</p>
            </div>

            {/* AI Toggle Card */}
            <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-secondary text-2xl">auto_awesome</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{t('ai_powered_insights')}</h3>
                            <p className="text-sm text-slate-400">{t('enable_ai_advice')}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={aiEnabled}
                            onChange={(e) => setAiEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                </div>
            </div>

            {/* Privacy Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-card p-4">
                <div className="flex gap-3">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">shield</span>
                    <div className="flex-1">
                        <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">{t('privacy_first')}</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            {t('ai_disclaimer')} {t('ai_privacy_note')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Insights Display */}
            {aiEnabled && (
                <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-6 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">{t('your_financial_insights')}</h3>
                        <button
                            onClick={fetchInsights}
                            disabled={loading}
                            className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-bold hover:bg-secondary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            {loading ? t('generating') : t('refresh')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
                            <p className="text-slate-400 text-sm">{t('analyzing_finance')}</p>
                        </div>
                    ) : insights ? (
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                                {insights}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">psychology</span>
                            <p className="text-slate-400">{t('click_refresh_generate')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Disabled State */}
            {!aiEnabled && (
                <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-12 border border-slate-100 dark:border-slate-700 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">psychology_alt</span>
                    <h3 className="font-bold text-xl mb-2">{t('ai_insights_disabled')}</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        {t('ai_disabled_desc')}
                    </p>
                </div>
            )}

            {/* Powered By */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">auto_awesome</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('powered_by_gemini')}</span>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
