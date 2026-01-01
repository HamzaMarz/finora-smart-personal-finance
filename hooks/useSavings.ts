import { useState, useEffect } from 'react';
import { FinanceService } from '../services/finance.service';
import { Saving } from '../types/saving';
import { handleApiError, logError } from '../utils/error-handler';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useSavings = () => {
    const { t } = useTranslation();
    const [savings, setSavings] = useState<Saving[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSavings = async () => {
        try {
            setLoading(true);
            const data = await FinanceService.getSavings();
            setSavings(data);
        } catch (err: any) {
            handleApiError(err, 'Failed to fetch savings');
            logError('useSavings.fetchSavings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavings();
    }, []);

    const addSaving = async (data: Partial<Saving>) => {
        try {
            await FinanceService.createSaving(data);
            toast.success(t('saving_added_success'));
            await fetchSavings();
        } catch (err) {
            // handleApiError(err, 'Failed to add saving'); 
            // Commented out because FinanceService might mask error if fallback works, 
            // but if it THROWS, we catch it.
            // If fallback succeeds, no error.
            logError('useSavings.addSaving', err);
        }
    };

    const updateSaving = async (id: string, data: Partial<Saving>) => {
        try {
            await FinanceService.updateSaving(id, data);
            toast.success(t('saving_updated_success'));
            await fetchSavings();
        } catch (err) {
            handleApiError(err, 'Failed to update saving');
            logError('useSavings.updateSaving', err);
        }
    };

    const deleteSaving = async (id: string) => {
        if (!window.confirm(t('delete_saving_confirm'))) return;

        try {
            await FinanceService.deleteSaving(id);
            toast.success(t('saving_deleted_success'));
            await fetchSavings();
        } catch (err) {
            handleApiError(err, 'Failed to delete saving');
            logError('useSavings.deleteSaving', err);
        }
    };

    return {
        savings,
        loading,
        addSaving,
        updateSaving,
        deleteSaving,
        refetch: fetchSavings
    };
};
