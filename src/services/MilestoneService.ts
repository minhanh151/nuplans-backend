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
        milestoneId: string
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
                .innerJoin("ms.profile", "profile")
                .where("ms.milestoneId = :milestoneId", { milestoneId })
                .andWhere("profile.userId = :userId", { userId: user.id })
                .orderBy("ms.stepNumber", "ASC")
                .getMany();

            logger.info(`Retrieved milestone ${milestoneId} with ${steps.length} steps for user ${user.id}`);

            return {
                id: milestone.id,
                name: milestone.name,
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
                steps: steps
            };
        } catch (error) {
            logger.error("Error fetching milestone detail:", error);
            throw error;
        }
    }
}
