import { AssetType, InvestmentStatus } from '../types/investment';

export const ASSET_TYPES: AssetType[] = ['stocks', 'crypto', 'bonds', 'real_estate', 'forex', 'manual', 'other'];

export const INVESTMENT_STATUSES: InvestmentStatus[] = ['active', 'closed'];

export const SUPPORTED_CURRENCIES = [
    'USD', 'ILS', 'JOD', 'SAR', 'AED',
    'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'
];

export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
    stocks: 'show_chart',
    crypto: 'currency_bitcoin',
    forex: 'currency_exchange',
    bonds: 'account_balance',
    real_estate: 'home',
    manual: 'edit_square',
    other: 'category'
};
