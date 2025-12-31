import { useAppStore } from '../store/useAppStore';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';

/**
 * Hook for currency formatting using app store currency
 */
export const useCurrency = () => {
    const { currency } = useAppStore();

    const formatCurrency = (amount: number, currencyOverride?: string) => {
        return formatCurrencyUtil(amount, currencyOverride || currency);
    };

    return {
        currency,
        formatCurrency
    };
};
