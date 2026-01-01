import { useState, useEffect } from 'react';
import { FinanceService } from '../services/finance.service';
import api from '../services/api';
import { Investment, AssetType, InvestmentStatus } from '../types/investment';
import { FilterStatus } from '../types/common';
import { handleApiError, logError } from '../utils/error-handler';
import { calculateTotalInvested, calculateMarketValue } from '../utils/calculations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useInvestments = () => {
    const { t } = useTranslation();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchInvestments = async () => {
        try {
            setLoading(true);
            const data = await FinanceService.getInvestments();
            setInvestments(data);
        } catch (err: any) {
            handleApiError(err, 'Failed to fetch investments');
            logError('useInvestments.fetchInvestments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, []);

    const addInvestment = async (data: Partial<Investment>) => {
        try {
            await FinanceService.createInvestment(data);
            toast.success(t('investment_added_success'));
            await fetchInvestments();
        } catch (err) {
            handleApiError(err, 'Failed to save investment');
            logError('useInvestments.addInvestment', err);
            throw err;
        }
    };

    const updateInvestment = async (id: string, data: Partial<Investment>) => {
        try {
            await FinanceService.updateInvestment(id, data);
            toast.success(t('investment_updated_success'));
            await fetchInvestments();
        } catch (err) {
            handleApiError(err, 'Failed to update investment');
            logError('useInvestments.updateInvestment', err);
            throw err;
        }
    };

    const deleteInvestment = async (id: string) => {
        if (!window.confirm(t('delete_confirm'))) return;

        try {
            await FinanceService.deleteInvestment(id);
            toast.success(t('investment_deleted_success'));
            await fetchInvestments();
        } catch (err) {
            handleApiError(err, 'Failed to delete investment');
            logError('useInvestments.deleteInvestment', err);
        }
    };

    const closeInvestment = async (id: string, data: { sellPrice: number, closeDate: string }) => {
        try {
            await FinanceService.closeInvestment(id, data);
            toast.success(t('investment_closed'));
            await fetchInvestments();
        } catch (err) {
            handleApiError(err, 'Failed to close investment');
            logError('useInvestments.closeInvestment', err);
            throw err;
        }
    };

    const refreshPrices = async () => {
        setLoading(true);
        // In demo mode or offline, we skip price refresh or we mock it.
        // For now, we wrap in try-catch and avoid breaking if API fails.
        const activeInvestments = investments.filter(i => i.status === 'active');

        for (const inv of activeInvestments) {
            if (inv.symbol && inv.assetType !== 'manual') {
                try {
                    // This route might fail in demo mode. We catch and ignore or use FinanceService which could eventually handle it.
                    // For direct API usage like this specific feature, we keep it but ensure it doesn't throw.
                    const priceRes = await api.get(`/api/market/price`, {
                        params: {
                            symbol: inv.symbol,
                            type: inv.assetType,
                            currency: inv.currency
                        }
                    });
                    if (priceRes.data.price) {
                        try {
                            await FinanceService.updateInvestment(inv.id, { currentValue: priceRes.data.price });
                        } catch (e) { }
                    }
                    await new Promise(r => setTimeout(r, 1000));
                } catch (err) {
                    logError(`useInvestments.refreshPrices[${inv.symbol}]`, err);
                }
            }
        }

        await fetchInvestments();
        setLoading(false);
        toast.success(t('prices_updated_success'));
    };

    const filteredInvestments = investments.filter(inv => {
        const matchesStatus = filter === 'all' || inv.status === filter;
        const matchesType = typeFilter === 'all' || inv.assetType === typeFilter;
        return matchesStatus && matchesType;
    });

    const activeInvestments = investments.filter(i => i.status === 'active');
    const totalInvested = calculateTotalInvested(investments);
    const currentMarketValue = calculateMarketValue(investments);
    const totalPL = currentMarketValue - totalInvested;
    const totalROI = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
        investments: filteredInvestments,
        loading,
        filter,
        setFilter,
        typeFilter,
        setTypeFilter,
        activeInvestments,
        totalInvested,
        currentMarketValue,
        totalPL,
        totalROI,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        closeInvestment,
        refreshPrices,
        refetch: fetchInvestments
    };
};
