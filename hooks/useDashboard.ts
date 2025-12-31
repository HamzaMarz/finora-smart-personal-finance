import { useState, useEffect } from 'react';
import { FinanceService } from '../services/finance.service';
import { DashboardSummary } from '../types/common';
import { logError } from '../utils/error-handler';

export const useDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardSummary | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const summary = await FinanceService.getSummary();
                setData(summary);
            } catch (error) {
                logError('useDashboard.fetchDashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    return {
        data,
        loading
    };
};
