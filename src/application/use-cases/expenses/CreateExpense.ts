import { Expense, ExpenseCategory } from '../../../domain/entities/Expense.js';
import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository.js';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { Notification } from '../../../domain/entities/Notification.js';

export interface CreateExpenseRequest {
    userId: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: string;
    expenseDate: string;
    isRecurring?: boolean;
    recurrenceType?: string;
}

/**
 * Use Case: Create Expense
 * Creates a new expense transaction with currency conversion
 */
export class CreateExpense {
    constructor(
        private readonly expenseRepository: IExpenseRepository,
        private readonly notificationRepository: INotificationRepository,
        private readonly currencyConverter: ICurrencyConverter
    ) { }

    async execute(request: CreateExpenseRequest): Promise<Expense> {
        // Convert amount to USD for storage
        const amountInUSD = await this.currencyConverter.convertToUSD(
            request.amount,
            request.currency
        );

        // Create expense entity
        const expense = Expense.create(
            request.userId,
            request.category,
            request.description,
            amountInUSD,
            new Date(request.expenseDate),
            request.isRecurring ?? false,
            request.recurrenceType
        );

        // Persist expense
        const savedExpense = await this.expenseRepository.create(expense);

        // Create notification
        const notification = Notification.forExpenseCreated(
            request.userId,
            request.category,
            request.amount,
            request.currency
        );
        await this.notificationRepository.create(notification);

        return savedExpense;
    }
}
