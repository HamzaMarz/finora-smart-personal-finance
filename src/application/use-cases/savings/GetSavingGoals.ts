import { Saving } from '../../../domain/entities/Saving.js';
import { ISavingRepository } from '../../../domain/repositories/ISavingRepository.js';

export interface SavingGoalProgress {
    saving: Saving;
    totalSaved: number;
    targetAmount: number;
    progressPercentage: number;
    isAchieved: boolean;
}

/**
 * Use Case: Get Saving Goals
 * Retrieves saving goals with progress tracking
 */
export class GetSavingGoals {
    constructor(
        private readonly savingRepository: ISavingRepository
    ) { }

    async execute(userId: string): Promise<SavingGoalProgress[]> {
        // Get all goal-type savings
        const goals = await this.savingRepository.findGoals(userId);

        // Calculate progress for each goal
        const goalsWithProgress: SavingGoalProgress[] = [];

        for (const goal of goals) {
            if (!goal.targetAmount) continue;

            // In real implementation, would sum all savings for this goal
            // For now, using the single saving amount
            const totalSaved = goal.amount.amount;
            const targetAmount = goal.targetAmount.amount;

            goalsWithProgress.push({
                saving: goal,
                totalSaved,
                targetAmount,
                progressPercentage: goal.getProgressPercentage(goal.amount),
                isAchieved: goal.isGoalAchieved(goal.amount)
            });
        }

        return goalsWithProgress;
    }

    async getAllSavings(userId: string): Promise<Saving[]> {
        return this.savingRepository.findByUserId(userId);
    }
}
