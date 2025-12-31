import toast from 'react-hot-toast';

/**
 * Handles API errors and displays user-friendly messages
 */
export const handleApiError = (
    error: any,
    defaultMessage: string = 'An error occurred'
): void => {
    const message = error?.response?.data?.message || error?.message || defaultMessage;
    toast.error(message);
};

/**
 * Logs error to console in development
 */
export const logError = (context: string, error: any): void => {
    if (import.meta.env.DEV) {
        console.error(`[${context}]`, error);
    }
};
