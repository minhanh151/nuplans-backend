import AppDataSource from "@/data-source";
import { DailyAction } from "@/models/DailyAction";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import logger from "@/utils/logger";
import { DailyActionStatus } from "@/interfaces/dailyAction/DailyActionStatus";
import { UserSubmission, SubmissionType, SubmissionStatus } from "@/admin/models/UserSubmission";

export class DailyActionService {
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);
    private userSubmissionRepo = AppDataSource.getRepository(UserSubmission);

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
                    "da.status",
                    "da.evidencePath",
                    "da.approvedAt",
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
     * Mark a daily action as completed (submitted) and save evidence path
     * @param user - The authenticated user
     * @param actionId - ID of the daily action to complete
     * @param evidencePath - Path to the evidence image
     * @returns Updated daily action
     */
    public async completeDailyAction(
        user: User,
        actionId: string,
        evidencePath: string
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

            if (dailyAction.status !== DailyActionStatus.IN_PROGRESS) {
                throw new Error("Daily action can only be completed when status is in-progress (0)");
            }

            dailyAction.actionDate = new Date();
            dailyAction.evidencePath = evidencePath;
            dailyAction.status = DailyActionStatus.SUBMITTED;

            const updatedAction = await this.dailyActionRepo.save(dailyAction);

            // Create user submission record
            const submission = this.userSubmissionRepo.create({
                userId: user.id,
                submissionType: SubmissionType.DAILY_ACTION,
                referenceId: Number(actionId),
                evidencePath: evidencePath,
                status: SubmissionStatus.SUBMITTED,
            });
            await this.userSubmissionRepo.save(submission);

            logger.info(`Daily action ${actionId} marked as completed (submitted) by user ${user.id}`);
            return updatedAction;
        } catch (error) {
            logger.error("Error completing daily action:", error);
            throw error;
        }
    }

    /**
     * Mark a daily action as incomplete and reset status/evidence
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

            if (dailyAction.status !== DailyActionStatus.SUBMITTED) {
                throw new Error("Daily action can only be uncompleted when status is submitted (1)");
            }

            dailyAction.completed = false;
            dailyAction.actionDate = null as any;
            dailyAction.evidencePath = '';
            dailyAction.status = DailyActionStatus.IN_PROGRESS;

            const updatedAction = await this.dailyActionRepo.save(dailyAction);

            // Delete user submission record
            await this.userSubmissionRepo.delete({
                userId: user.id,
                submissionType: SubmissionType.DAILY_ACTION,
                referenceId: Number(actionId),
            });

            logger.info(`Daily action ${actionId} marked as incomplete by user ${user.id}`);
            return updatedAction;
        } catch (error) {
            logger.error("Error uncompleting daily action:", error);
            throw error;
        }
    }
}
