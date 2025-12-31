/**
 * Validates that a form field is not empty
 */
export const validateRequired = (value: string | number): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
};

/**
 * Validates that a number is positive
 */
export const validatePositiveNumber = (value: number): boolean => {
    return value > 0;
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Sanitizes decimal input (converts Arabic numerals, removes non-numeric chars)
 */
export const sanitizeDecimalInput = (value: string): string => {
    // Convert Arabic numerals to Western
    let sanitized = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // Remove non-numeric characters except decimal point
    sanitized = sanitized.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    return sanitized;
};

/**
 * Converts sanitized string to number
 */
export const parseDecimalInput = (value: string): number => {
    if (value === '' || value === '.') return 0;
    return parseFloat(value) || 0;
};
