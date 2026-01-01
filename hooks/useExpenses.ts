import { useState, useEffect } from 'react';
import api from '../services/api';
import { FinanceService } from '../services/finance.service';
import { Expense } from '../types/expense';
import { handleApiError, logError } from '../utils/error-handler';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useExpenses = () => {
    const { t } = useTranslation();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await FinanceService.getExpenses();
            setExpenses(data);
        } catch (err: any) {
            handleApiError(err, 'Failed to fetch expenses');
            logError('useExpenses.fetchExpenses', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const addExpense = async (data: Partial<Expense>) => {
        try {
            await FinanceService.createExpense(data);
            toast.success(t('expense_added_title'));
            await fetchExpenses();
        } catch (err) {
            handleApiError(err, 'Failed to add expense');
            logError('useExpenses.addExpense', err);
            throw err;
        }
    };

    const updateExpense = async (id: string, data: Partial<Expense>) => {
        try {
            await FinanceService.updateExpense(id, data);
            toast.success(t('save_changes'));
            await fetchExpenses();
        } catch (err) {
            handleApiError(err, 'Failed to update expense');
            logError('useExpenses.updateExpense', err);
            throw err;
        }
    };

    const deleteExpense = async (id: string) => {
        if (!window.confirm(t('delete_confirm'))) return;

        try {
            await FinanceService.deleteExpense(id);
            toast.success('Expense deleted');
            await fetchExpenses();
        } catch (err) {
            handleApiError(err, 'Failed to delete expense');
            logError('useExpenses.deleteExpense', err);
        }
    };

    return {
        expenses,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        refetch: fetchExpenses
    };
};
