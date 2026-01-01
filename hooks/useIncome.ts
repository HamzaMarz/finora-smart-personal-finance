
import { useState, useEffect } from 'react';
import { Income } from '../types/income';
import { handleApiError, logError } from '../utils/error-handler';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IncomeRepository } from '../services/repositories/IncomeRepository';

export const useIncome = () => {
    const { t } = useTranslation();
    const [income, setIncome] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            const data = await IncomeRepository.getAll();
            setIncome(data);
        } catch (err: any) {
            console.error('Failed to fetch income logic', err);
            // handleApiError(err, 'Failed to fetch income'); // Maybe too noisy for offline fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Listen for sync events to refresh data after background sync
        const handleSync = () => {
            console.log('Refreshing income after sync...');
            fetchIncome();
        };
        window.addEventListener('finora-synced', handleSync);

        fetchIncome();

        return () => {
            window.removeEventListener('finora-synced', handleSync);
        };
    }, []);

    const addIncome = async (data: Partial<Income>) => {
        try {
            await IncomeRepository.create(data);
            toast.success(t('income_added_success'));
            await fetchIncome();
        } catch (err) {
            handleApiError(err, 'Failed to add income');
            logError('useIncome.addIncome', err);
            throw err;
        }
    };

    const updateIncome = async (id: string, data: Partial<Income>) => {
        try {
            await IncomeRepository.update(id, data);
            toast.success(t('income_updated_success'));
            await fetchIncome();
        } catch (err) {
            handleApiError(err, 'Failed to update income');
            logError('useIncome.updateIncome', err);
            throw err;
        }
    };

    const deleteIncome = async (id: string) => {
        if (!window.confirm(t('delete_income_confirm'))) return;

        try {
            await IncomeRepository.delete(id);
            toast.success(t('income_deleted_success'));
            await fetchIncome();
        } catch (err) {
            handleApiError(err, 'Failed to delete income');
            logError('useIncome.deleteIncome', err);
        }
    };

    return {
        income,
        loading,
        addIncome,
        updateIncome,
        deleteIncome,
        refetch: fetchIncome
    };
};
