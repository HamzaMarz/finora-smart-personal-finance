/**
 * Formats a number as currency using Intl.NumberFormat
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'USD', 'ILS')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number,
    currencyCode: string,
    options: Intl.NumberFormatOptions = {}
): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 0,
        ...options
    };

    return new Intl.NumberFormat('en-US', defaultOptions).format(amount);
};

/**
 * Formats currency for charts (shorter format)
 */
export const formatCurrencyForChart = (
    value: number,
    currency: string,
    language: string
): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    }).format(value);
};
