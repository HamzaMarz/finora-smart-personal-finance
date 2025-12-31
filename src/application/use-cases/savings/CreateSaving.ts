import { Saving, SavingType } from '../../../domain/entities/Saving.js';
import { ISavingRepository } from '../../../domain/repositories/ISavingRepository.js';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { Notification } from '../../../domain/entities/Notification.js';
import { Money } from '../../../domain/value-objects/Money.js';

export interface CreateSavingRequest {
    userId: string;
    amount: number;
    currency: string;
    type: SavingType;
    savingDate: string;
    notes?: string;
    goalName?: string;
    targetAmount?: number;
}

/**
 * Use Case: Create Saving
 * Records a new saving transaction or goal
 */
export class CreateSaving {
    constructor(
        private readonly savingRepository: ISavingRepository,
        private readonly notificationRepository: INotificationRepository,
        private readonly currencyConverter: ICurrencyConverter
    ) { }

    async execute(request: CreateSavingRequest): Promise<Saving> {
        // Convert amount to USD for storage
        const amountInUSD = await this.currencyConverter.convertToUSD(
            request.amount,
            request.currency
        );

        // Convert target amount if provided
        let targetAmountMoney: Money | undefined;
        if (request.targetAmount) {
            targetAmountMoney = await this.currencyConverter.convertToUSD(
                request.targetAmount,
                request.currency
            );
        }

        // Create saving entity
        const saving = Saving.create(
            request.userId,
            amountInUSD,
            request.type,
            new Date(request.savingDate),
            request.notes,
            request.goalName,
            targetAmountMoney
        );

        // Persist saving
        const savedSaving = await this.savingRepository.create(saving);

        // Create notification
        const notification = Notification.create(
            request.userId,
            'saving',
            'savings',
            'saving_recorded_title',
            JSON.stringify({
                key: 'saving_recorded_msg',
                params: {
                    amount: request.amount.toFixed(2),
                    currency: request.currency
                }
            })
        );
        await this.notificationRepository.create(notification);

        return savedSaving;
    }
}
