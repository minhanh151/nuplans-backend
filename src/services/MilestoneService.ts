import AppDataSource from "@/data-source";
import { Milestone } from "@/models/Milestone";
import { MilestoneStep } from "@/models/MilestoneStep";
import { User } from "@/models/User";
import { LessThanOrEqual } from "typeorm";
import logger from "@/utils/logger";
import { MilestoneDetail } from "@/interfaces/MilestoneDetail";

export class MilestoneService {
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private milestoneStepRepo = AppDataSource.getRepository(MilestoneStep);

    /**
     * Get milestones for a user with optional filters
     * @param user - The authenticated user
     * @param maxDeadline - Optional max deadline filter (YYYY-MM-DD format)
     * @param status - Optional status filter
     * @param limit - Maximum number of records to return (default: 10)
     * @returns Array of milestones
     */
    public async getMilestones(
        user: User,
        maxDeadline?: string,
        status?: string,
        limit: number = 10
    ): Promise<Milestone[]> {
        try {
            // Build query
            let query = this.milestoneRepo
                .createQueryBuilder("m")
                .where("m.userId = :userId", { userId: user.id });

            // Add max deadline filter if provided
            if (maxDeadline) {
                const deadline = new Date(maxDeadline);
                deadline.setHours(23, 59, 59, 999);

                query = query.andWhere("m.deadline <= :maxDeadline", { maxDeadline: deadline });
            }

            // Add status filter if provided
            if (status) {
                query = query.andWhere("m.status = :status", { status });
            }

            // Execute query with ordering and limit
            const milestones = await query
                .orderBy("m.deadline", "ASC")
                .take(limit)
                .getMany();

            logger.info(`Retrieved ${milestones.length} milestones for user ${user.id}`);
            return milestones;
        } catch (error) {
            logger.error("Error fetching milestones:", error);
            throw error;
        }
    }

    /**
     * Get milestone detail with its steps
     * @param user - The authenticated user
     * @param milestoneId - ID of the milestone
     * @returns Milestone with steps
     */
    public async getMilestoneDetail(
        user: User,
        milestoneId: number
    ): Promise<MilestoneDetail> {
        try {
            // Get milestone with user verification
            const milestone = await this.milestoneRepo
                .createQueryBuilder("m")
                .where("m.id = :milestoneId", { milestoneId })
                .andWhere("m.userId = :userId", { userId: user.id })
                .getOne();

            if (!milestone) {
                throw new Error("Milestone not found or you don't have permission to view it");
            }

            // Get milestone steps
            const steps = await this.milestoneStepRepo
                .createQueryBuilder("ms")
                .where("ms.milestoneId = :milestoneId", { milestoneId })
                .orderBy("ms.stepNumber", "ASC")
                .getMany();

            const stepsDetail = steps.map((step) => ({
                id: step.id,
                title: step.label,
                description: step.description,
                stepNumber: step.stepNumber,
                completed: step.isCompleted,
                createdAt: step.createdAt,
            }));

            logger.info(`Retrieved milestone ${milestoneId} with ${steps.length} steps for user ${user.id}`);

            return {
                id: milestone.id,
                title: milestone.name,
                category: milestone.category || "",
                priority: milestone.priority || "",
                estimatedTime: milestone.estimatedTime || "",
                description: milestone.description || "",
                verificationMethod: milestone.verificationMethod || "",
                deadline: milestone.deadline,
                evidenceSubmitted: milestone.evidenceSubmitted || false,
                progress: milestone.progress || 0,
                status: milestone.status,
                createdAt: milestone.createdAt,
                steps: stepsDetail
            };
        } catch (error) {
            logger.error("Error fetching milestone detail:", error);
            throw error;
        }
    }

    /**
     * Mark a milestone step as completed
     * @param user - The authenticated user
     * @param stepId - ID of the milestone step to complete
     * @returns Updated milestone step
     */
    public async completeStep(
        user: User,
        stepId: number
    ): Promise<MilestoneStep> {
        try {
            // Find the step and verify user owns the associated milestone
            const step = await this.milestoneStepRepo
                .createQueryBuilder("ms")
                .leftJoinAndSelect("ms.milestone", "m")
                .where("ms.id = :stepId", { stepId })
                .andWhere("ms.userId = :userId", { userId: user.id })
                .getOne();

            if (!step) {
                throw new Error("Milestone step not found or you don't have permission to update it");
            }

            // Update completion status
            step.isCompleted = true;

            const updatedStep = await this.milestoneStepRepo.save(step);

            logger.info(`Milestone step ${stepId} marked as completed by user ${user.id}`);
            return updatedStep;
        } catch (error) {
            logger.error("Error completing milestone step:", error);
            throw error;
        }
    }

    /**
     * Mark a milestone step as uncompleted
     * @param user - The authenticated user
     * @param stepId - ID of the milestone step to uncomplete
     * @returns Updated milestone step
     */
    public async uncompleteStep(
        user: User,
        stepId: number
    ): Promise<MilestoneStep> {
        try {
            // Find the step and verify user owns the associated milestone
            const step = await this.milestoneStepRepo
                .createQueryBuilder("ms")
                .leftJoinAndSelect("ms.milestone", "m")
                .where("ms.id = :stepId", { stepId })
                .andWhere("ms.userId = :userId", { userId: user.id })
                .getOne();

            if (!step) {
                throw new Error("Milestone step not found or you don't have permission to update it");
            }

            // Update completion status
            step.isCompleted = false;

            const updatedStep = await this.milestoneStepRepo.save(step);

            logger.info(`Milestone step ${stepId} marked as uncompleted by user ${user.id}`);
            return updatedStep;
        } catch (error) {
            logger.error("Error uncompleting milestone step:", error);
            throw error;
        }
    }
}
