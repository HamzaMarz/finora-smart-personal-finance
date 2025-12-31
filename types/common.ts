export type FilterStatus = 'all' | 'active' | 'closed';

export interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

export interface DashboardSummary {
    netWorth: number;
    income: number;
    expenses: number;
    savings: number;
}

export interface AssetSearchResult {
    symbol: string;
    name: string;
    type: string;
    currency: string;
}
