import { useState, useEffect } from 'react';
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
            const response = await api.get('/investments');
            setInvestments(response.data);
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
            await api.post('/investments', data);
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
            await api.put(`/investments/${id}`, data);
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
            await api.delete(`/investments/${id}`);
            toast.success(t('investment_deleted_success'));
            await fetchInvestments();
        } catch (err) {
            handleApiError(err, 'Failed to delete investment');
            logError('useInvestments.deleteInvestment', err);
        }
    };

    const closeInvestment = async (id: string, data: { sellPrice: number, closeDate: string }) => {
        try {
            await api.put(`/investments/${id}/close`, data);
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
        const activeInvestments = investments.filter(i => i.status === 'active');

        for (const inv of activeInvestments) {
            if (inv.symbol && inv.assetType !== 'manual') {
                try {
                    const priceRes = await api.get(`/api/market/price`, {
                        params: {
                            symbol: inv.symbol,
                            type: inv.assetType,
                            currency: inv.currency
                        }
                    });
                    if (priceRes.data.price) {
                        await api.put(`/investments/${inv.id}`, { currentValue: priceRes.data.price });
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
