import { useAppStore } from '../store/useAppStore';
import { formatDate as formatDateUtil, formatTime as formatTimeUtil } from '../utils/date';

/**
 * Hook for date/time formatting with i18n support
 */
export const useDateTime = () => {
    const { language } = useAppStore();

    const formatDate = (dateStr: string) => {
        return formatDateUtil(dateStr, language);
    };

    const formatTime = (dateStr: string) => {
        return formatTimeUtil(dateStr, language);
    };

    return {
        formatDate,
        formatTime
    };
};
