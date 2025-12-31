import { ExpenseCategory } from '../types/expense';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'housing',
    'food',
    'transport',
    'leisure',
    'health',
    'education',
    'shopping',
    'utilities',
    'other'
];

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
    housing: 'home',
    food: 'restaurant',
    transport: 'directions_car',
    leisure: 'sports_esports',
    health: 'favorite',
    education: 'school',
    shopping: 'shopping_bag',
    utilities: 'bolt',
    other: 'more_horiz'
};
