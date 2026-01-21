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
        const { projects } = await PlanningAssistant.getInstance()
            .generateProjects(user, profile);
    }
}
