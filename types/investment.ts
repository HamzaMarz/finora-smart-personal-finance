export interface Investment {
    id: string;
    assetName: string;
    assetType: 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'forex' | 'manual' | 'other';
    symbol?: string;
    quantity: number;
    buyPrice: number;
    currentValue: number;
    initialAmount: number;
    sellPrice?: number;
    currency: string;
    purchaseDate: string;
    closeDate?: string;
    status: 'active' | 'closed';
    notes?: string;
    profitLoss: number;
    roi: number;
}

export type AssetType = Investment['assetType'];
export type InvestmentStatus = Investment['status'];
