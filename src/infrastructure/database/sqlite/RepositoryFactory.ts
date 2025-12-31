import { StorageService } from '../../../database/storage.service.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';
import { SqliteIncomeRepository } from './SqliteIncomeRepository.js';
import { SqliteExpenseRepository } from './SqliteExpenseRepository.js';
import { SqliteSavingRepository } from './SqliteSavingRepository.js';
import { SqliteInvestmentRepository } from './SqliteInvestmentRepository.js';
import { SqliteNotificationRepository } from './SqliteNotificationRepository.js';
import { SqliteExchangeRateRepository } from './SqliteExchangeRateRepository.js';

/**
 * Repository Factory
 * Creates and provides repository instances
 */
export class RepositoryFactory {
    private static userRepo: SqliteUserRepository;
    private static incomeRepo: SqliteIncomeRepository;
    private static expenseRepo: SqliteExpenseRepository;
    private static savingRepo: SqliteSavingRepository;
    private static investmentRepo: SqliteInvestmentRepository;
    private static notificationRepo: SqliteNotificationRepository;
    private static exchangeRateRepo: SqliteExchangeRateRepository;

    static getUserRepository(): SqliteUserRepository {
        if (!this.userRepo) {
            this.userRepo = new SqliteUserRepository(StorageService);
        }
        return this.userRepo;
    }

    static getIncomeRepository(): SqliteIncomeRepository {
        if (!this.incomeRepo) {
            this.incomeRepo = new SqliteIncomeRepository(StorageService);
        }
        return this.incomeRepo;
    }

    static getExpenseRepository(): SqliteExpenseRepository {
        if (!this.expenseRepo) {
            this.expenseRepo = new SqliteExpenseRepository(StorageService);
        }
        return this.expenseRepo;
    }

    static getSavingRepository(): SqliteSavingRepository {
        if (!this.savingRepo) {
            this.savingRepo = new SqliteSavingRepository(StorageService);
        }
        return this.savingRepo;
    }

    static getInvestmentRepository(): SqliteInvestmentRepository {
        if (!this.investmentRepo) {
            this.investmentRepo = new SqliteInvestmentRepository(StorageService);
        }
        return this.investmentRepo;
    }

    static getNotificationRepository(): SqliteNotificationRepository {
        if (!this.notificationRepo) {
            this.notificationRepo = new SqliteNotificationRepository(StorageService);
        }
        return this.notificationRepo;
    }

    static getExchangeRateRepository(): SqliteExchangeRateRepository {
        if (!this.exchangeRateRepo) {
            this.exchangeRateRepo = new SqliteExchangeRateRepository(StorageService);
        }
        return this.exchangeRateRepo;
    }

    /**
     * Reset all repository instances (useful for testing)
     */
    static reset(): void {
        this.userRepo = undefined as any;
        this.incomeRepo = undefined as any;
        this.expenseRepo = undefined as any;
        this.savingRepo = undefined as any;
        this.investmentRepo = undefined as any;
        this.notificationRepo = undefined as any;
        this.exchangeRateRepo = undefined as any;
    }
}
