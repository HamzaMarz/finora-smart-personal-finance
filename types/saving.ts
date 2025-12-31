export interface Saving {
    id: string;
    amount: number;
    type: SavingType;
    date: string;
    notes?: string;
    currency: string;
}

export type SavingType = 'manual' | 'automatic';
