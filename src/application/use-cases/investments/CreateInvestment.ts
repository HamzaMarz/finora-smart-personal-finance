import { Investment } from '../../../domain/entities/Investment.js';
import { IInvestmentRepository } from '../../../domain/repositories/IInvestmentRepository.js';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import { ICurrencyConverter } from '../../../domain/services/ICurrencyConverter.js';
import { Notification } from '../../../domain/entities/Notification.js';
import { AssetType } from '../../../domain/entities/Investment.js';

export interface CreateInvestmentRequest {
    userId: string;
    assetName: string;
    assetType: AssetType;
    symbol?: string;
    quantity: number;
    buyPrice: number;
    currentValue: number;
    currency: string;
    purchaseDate: string;
    notes?: string;
}

/**
 * Use Case: Create Investment
 * Creates a new investment position
 */
export class CreateInvestment {
    constructor(
        private readonly investmentRepository: IInvestmentRepository,
        private readonly notificationRepository: INotificationRepository,
        private readonly currencyConverter: ICurrencyConverter
    ) { }

    async execute(request: CreateInvestmentRequest): Promise<Investment> {
        // Convert prices to Money value objects (stored in original currency)
        const buyPriceMoney = await this.currencyConverter.convert(
            request.buyPrice,
            request.currency,
            request.currency // Keep same currency
        );

        const currentValueMoney = await this.currencyConverter.convert(
            request.currentValue,
            request.currency,
            request.currency
        );

        // Create investment entity
        const investment = Investment.create(
            request.userId,
            request.assetName,
            request.assetType,
            request.quantity,
            buyPriceMoney,
            currentValueMoney,
            new Date(request.purchaseDate),
            request.symbol,
            request.notes
        );

        // Persist investment
        const savedInvestment = await this.investmentRepository.create(investment);

        // Create notification
        const totalAmount = request.buyPrice * request.quantity;
        const notification = Notification.forInvestmentCreated(
            request.userId,
            request.assetName,
            request.assetType,
            totalAmount,
            request.currency
        );
        await this.notificationRepository.create(notification);

        return savedInvestment;
    }
}
