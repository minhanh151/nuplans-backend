import AppDataSource from "@/data-source";
import { DailyAction } from "@/models/DailyAction";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import logger from "@/utils/logger";

export class DailyActionService {
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);

    /**
     * Get daily actions for a user with optional filters
     * @param user - The authenticated user
     * @param createdDate - Optional date filter (YYYY-MM-DD format)
     * @param limit - Maximum number of records to return (default: 10)
     * @returns Array of daily actions
     */
    public async getDailyActions(
        user: User,
        createdDate?: string,
        limit: number = 10
    ): Promise<DailyAction[]> {
        try {
            // Build query with user_id filter
            let query = this.dailyActionRepo
                .createQueryBuilder("da")
                .where("da.userId = :userId", { userId: user.id });

            // Add date filter if provided
            if (createdDate) {
                const startDate = new Date(createdDate);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(createdDate);
                endDate.setHours(23, 59, 59, 999);

                query = query.andWhere("da.createdAt BETWEEN :startDate AND :endDate", {
                    startDate,
                    endDate
                });
            }

            // Execute query with ordering and limit
            const dailyActions = await query
                .orderBy("da.id")
                .take(limit)
                .select([
                    "da.id",
                    "da.title",
                    "da.description",
                    "da.priority",
                    "da.category",
                    "da.estimatedTime",
                    "da.actionDate",
                    "da.completed",
                    "da.createdAt",
                ])
                .getMany();

            logger.info(`Retrieved ${dailyActions.length} daily actions for user ${user.id}`);
            return dailyActions;
        } catch (error) {
            logger.error("Error fetching daily actions:", error);
            throw error;
        }
    }

    /**
     * Mark a daily action as completed and update actionDate to today
     * @param user - The authenticated user
     * @param actionId - ID of the daily action to complete
     * @returns Updated daily action
     */
    public async completeDailyAction(
        user: User,
        actionId: string
    ): Promise<DailyAction> {
        try {
            // Find the daily action with user verification
            const dailyAction = await this.dailyActionRepo
                .createQueryBuilder("da")
                .where("da.id = :actionId", { actionId })
                .andWhere("da.userId = :userId", { userId: user.id })
                .getOne();

            if (!dailyAction) {
                throw new Error("Daily action not found or you don't have permission to update it");
            }

            // Update completed status and actionDate to today
            dailyAction.completed = true;
            dailyAction.actionDate = new Date();

            const updatedAction = await this.dailyActionRepo.save(dailyAction);

            logger.info(`Daily action ${actionId} marked as completed by user ${user.id}`);
            return updatedAction;
        } catch (error) {
            logger.error("Error completing daily action:", error);
            throw error;
        }
    }

    /**
     * Mark a daily action as incomplete and reset actionDate
     * @param user - The authenticated user
     * @param actionId - ID of the daily action to uncomplete
     * @returns Updated daily action
     */
    public async uncompleteDailyAction(
        user: User,
        actionId: string
    ): Promise<DailyAction> {
        try {
            // Find the daily action with user verification
            const dailyAction = await this.dailyActionRepo
                .createQueryBuilder("da")
                .where("da.id = :actionId", { actionId })
                .andWhere("da.userId = :userId", { userId: user.id })
                .getOne();

            if (!dailyAction) {
                throw new Error("Daily action not found or you don't have permission to update it");
            }

            // Update completed status and reset actionDate
            dailyAction.completed = false;
            dailyAction.actionDate = null as any;

            const updatedAction = await this.dailyActionRepo.save(dailyAction);

            logger.info(`Daily action ${actionId} marked as incomplete by user ${user.id}`);
            return updatedAction;
        } catch (error) {
            logger.error("Error uncompleting daily action:", error);
            throw error;
        }
    }
}
