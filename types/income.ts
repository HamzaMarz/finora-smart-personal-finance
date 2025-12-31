export interface Income {
    id: string;
    sourceName: string;
    amount: number;
    recurrence: Recurrence;
    date: string;
    isActive: boolean;
    currency: string;
}

export type IncomeCategory = 'salary' | 'freelance' | 'other';
export type Recurrence = 'monthly' | 'weekly' | 'once' | 'yearly';
