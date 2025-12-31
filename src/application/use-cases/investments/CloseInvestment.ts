import { Investment } from '../../../domain/entities/Investment.js';
import { IInvestmentRepository } from '../../../domain/repositories/IInvestmentRepository.js';
import { NotFoundError } from '../../../shared/errors/DomainError.js';
import { Money } from '../../../domain/value-objects/Money.js';

export interface CloseInvestmentRequest {
    investmentId: string;
    sellPrice: number;
    currency: string;
    closeDate: string;
}

/**
 * Use Case: Close Investment
 * Closes an active investment position
 */
export class CloseInvestment {
    constructor(
        private readonly investmentRepository: IInvestmentRepository
    ) { }

    async execute(request: CloseInvestmentRequest): Promise<Investment> {
        // Find investment
        const investment = await this.investmentRepository.findById(request.investmentId);
        if (!investment) {
            throw new NotFoundError('Investment', request.investmentId);
        }

        // Create Money for sell price
        const sellPriceMoney = Money.create(request.sellPrice, request.currency);

        // Close investment (domain method handles business rules)
        const closedInvestment = investment.close(
            sellPriceMoney,
            new Date(request.closeDate)
        );

        // Persist changes
        await this.investmentRepository.update(request.investmentId, closedInvestment);

        return closedInvestment;
    }
}
