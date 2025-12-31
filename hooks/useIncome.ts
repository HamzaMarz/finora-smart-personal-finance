import { useState, useEffect } from 'react';
import api from '../services/api';
import { Income } from '../types/income';
import { handleApiError, logError } from '../utils/error-handler';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useIncome = () => {
    const { t } = useTranslation();
    const [income, setIncome] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            const response = await api.get('/income');
            setIncome(response.data);
        } catch (err: any) {
            handleApiError(err, 'Failed to fetch income');
            logError('useIncome.fetchIncome', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncome();
    }, []);

    const addIncome = async (data: Partial<Income>) => {
        try {
            await api.post('/income', data);
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
            await api.put(`/income/${id}`, data);
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
            await api.delete(`/income/${id}`);
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
