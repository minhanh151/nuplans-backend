import AppDataSource from "@/data-source";
import { Milestone } from "@/models/Milestone";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import logger from "@/utils/logger";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { ChatThreadHandler } from "./handlers/ChatThreadHandler";
import { UserContextBuilder } from "./UserContextBuilder";

export class WeeklyPlanningGenerator {
    private userRepo = AppDataSource.getRepository(User);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private projectRepo = AppDataSource.getRepository(Project);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);

    private static instance: WeeklyPlanningGenerator;

    public static getInstance(): WeeklyPlanningGenerator {
        if (!WeeklyPlanningGenerator.instance) {
            WeeklyPlanningGenerator.instance = new WeeklyPlanningGenerator();
        }
        return WeeklyPlanningGenerator.instance;
    }

    /**
     * Runs the weekly generation process for all users with a roadmap.
     */
    public async runWeeklyGeneration(): Promise<void> {
        logger.info("Starting weekly plan generation process...");
        try {
            const users = await this.userRepo.find();
            for (const user of users) {
                await this.processUser(user);
            }
            logger.info("Weekly plan generation process completed.");
        } catch (error) {
            logger.error("Error in runWeeklyGeneration:", error);
        }
    }

    public async processUser(user: User): Promise<void> {
        try {
            // 1. Check if user has milestones and projects (roadmap)
            const milestoneCount = await this.milestoneRepo.count({ where: { userId: user.id } });
            const projectCount = await this.projectRepo.count({ where: { userId: user.id } });

            if (milestoneCount === 0 || projectCount === 0) {
                logger.info(`Skipping user ${user.id}: Roadmap incomplete (M: ${milestoneCount}, P: ${projectCount}).`);
                return;
            }

            // 2. Determine current week number
            // For simplicity, we can use the number of existing weekly plans + 1
            const lastPlan = await this.weeklyPlanRepo.findOne({
                where: { userId: user.id },
                order: { weekNumber: "DESC" }
            });
            const nextWeekNumber = lastPlan ? lastPlan.weekNumber + 1 : 1;

            // 3. Generate UserContext
            const userContext = await UserContextBuilder.getInstance().build(user);

            // 4. Generate WeeklyPlan using PlanningAssistant
            logger.info(`Generating weekly plan for user ${user.id}, week ${nextWeekNumber}...`);
            const planningAssistant = PlanningAssistant.getInstance();
            const weeklyPlan = await planningAssistant.generateWeeklyPlan(user, userContext, nextWeekNumber);

            // Save the plan
            const savedPlan = await this.weeklyPlanRepo.save(weeklyPlan);
            logger.info(`Saved WeeklyPlan ${savedPlan.id} for user ${user.id}.`);

            ChatThreadHandler.getInstance().createWeeklyPlanThread(user, savedPlan);
            logger.info(`Created ChatThread for WeeklyPlan ${savedPlan.id}, user ${user.id}.`);

        } catch (error) {
            logger.error(`Error processing user ${user.id}:`, error);
        }
    }
}
