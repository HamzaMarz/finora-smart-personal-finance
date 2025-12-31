/**
 * Formats a date string to locale-specific format
 * @param dateStr - ISO date string
 * @param language - Language code ('en' or 'ar')
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string, language: string = 'en'): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    const locale = language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Formats a date string to time in locale-specific format
 * @param dateStr - ISO date string
 * @param language - Language code ('en' or 'ar')
 * @returns Formatted time string
 */
export const formatTime = (dateStr: string, language: string = 'en'): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    const locale = language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Gets today's date in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};
