export interface Expense {
    id: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
    recurring: boolean;
    currency: string;
}

export type ExpenseCategory =
    | 'housing'
    | 'food'
    | 'transport'
    | 'leisure'
    | 'health'
    | 'education'
    | 'shopping'
    | 'utilities'
    | 'other';
