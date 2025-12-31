import { Income } from '../../../domain/entities/Income.js';
import { IIncomeRepository } from '../../../domain/repositories/IIncomeRepository.js';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { Notification } from '../../../domain/entities/Notification.js';
import { RecurrenceType } from '../../../domain/value-objects/Recurrence.js';

export interface CreateIncomeRequest {
    userId: string;
    sourceName: string;
    amount: number;
    currency: string;
    recurrence: RecurrenceType;
    startDate: string;
    isActive?: boolean;
}

/**
 * Use Case: Create Income
 * Orchestrates income creation with currency conversion and notifications
 */
export class CreateIncome {
    constructor(
        private readonly incomeRepository: IIncomeRepository,
        private readonly notificationRepository: INotificationRepository,
        private readonly currencyConverter: ICurrencyConverter
    ) { }

    async execute(request: CreateIncomeRequest): Promise<Income> {
        // Convert amount to USD for storage
        const amountInUSD = await this.currencyConverter.convertToUSD(
            request.amount,
            request.currency
        );

        // Create income entity
        const income = Income.create(
            request.userId,
            request.sourceName,
            amountInUSD,
            request.recurrence,
            new Date(request.startDate),
            request.isActive ?? true
        );

        // Persist income
        const savedIncome = await this.incomeRepository.create(income);

        // Create notification
        const notification = Notification.forIncomeCreated(
            request.userId,
            request.sourceName,
            request.amount,
            request.currency
        );
        await this.notificationRepository.create(notification);

        return savedIncome;
    }
}
