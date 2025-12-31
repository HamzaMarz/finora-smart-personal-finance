import { Income } from '../../../domain/entities/Income.js';
import { IIncomeRepository } from '../../../domain/repositories/IIncomeRepository.js';
import { NotFoundError } from '../../../shared/errors/DomainError.js';

/**
 * Use Case: Get User Incomes
 * Retrieves all income sources for a user
 */
export class GetUserIncomes {
    constructor(
        private readonly incomeRepository: IIncomeRepository
    ) { }

    async execute(userId: string): Promise<Income[]> {
        const incomes = await this.incomeRepository.findByUserId(userId);
        return incomes;
    }

    async getActive(userId: string): Promise<Income[]> {
        const incomes = await this.incomeRepository.findActiveByUserId(userId);
        return incomes;
    }
}
