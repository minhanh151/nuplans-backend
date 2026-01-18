import AppDataSource from "@/data-source";
import { Profile } from "@/models/Profile";
import { Milestone } from "@/models/Milestone";
import { User } from "@/models/User";
import { PlanningAssistant } from "@/services/assistant/PlanningAssistant";
import { ChatThreadHandler } from "./handlers/ChatThreadHandler";
import { WeeklyPlanningGenerator } from "./WeeklyPlanningGenerator";
import { UserContextBuilder } from "./UserContextBuilder";
import logger from "@/utils/logger";
import { WeeklyPlan } from "@/models/WeeklyPlan";

export class DashboardService {
    private profileRepo = AppDataSource.getRepository(Profile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);

    public async generateDashboardData(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        const { milestones, projects, isExisted } = await PlanningAssistant.getInstance()
            .initMileStonesAndProjects(user, profile);

        // Run background tasks asynchronously
        (async () => {
            try {
                for (const milestone of milestones) {
                    await ChatThreadHandler.getInstance().createMilestoneThread(user, milestone);
                }
                for (const project of projects) {
                    await ChatThreadHandler.getInstance().createProjectThread(user, project);
                }
                await this.genFirstWeeklyPlan(user);
                logger.info(`Background generation completed for user: ${user.id}`);
            } catch (error) {
                logger.error(`Error in background generation for user ${user.id}:`, error);
            }
        })();
    }

    private async genFirstWeeklyPlan(user: User) {
        await WeeklyPlanningGenerator.getInstance().processUser(user);
        const userContext = await UserContextBuilder.getInstance().build(user);
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            logger.error("Profile not found for user: " + user.id);
            return;
        }
        let weeklyPlan = await PlanningAssistant.getInstance().generateWeeklyPlan(user, userContext, 1);
        weeklyPlan = await this.weeklyPlanRepo.save(weeklyPlan);
        await PlanningAssistant.getInstance().generateDailyActions(userContext, profile, weeklyPlan);

        const firstMilestone = await this.milestoneRepo.findOne({
            where: { userId: user.id },
            order: { deadline: "ASC" }
        });
        if (!firstMilestone) {
            logger.error("First milestone not found for user: " + user.id);
            return;
        }
        await PlanningAssistant.getInstance().generateMilestoneTasks(userContext, profile, firstMilestone);
    }

}
