import AppDataSource from "@/data-source";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { PlanningAssistant } from "@/services/assistant/PlanningAssistant";
import { UserContextBuilder } from "./UserContextBuilder";
import { DateUtils } from "@/utils/dateUtils";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { DailyAction } from "@/models/DailyAction";
import { MilestoneTask } from "@/models/MilestoneTask";

export class DashboardService {
    private profileRepo = AppDataSource.getRepository(Profile);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);
    private milestoneTaskRepo = AppDataSource.getRepository(MilestoneTask);

    public async generateDashboardData(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        const { milestones, projects } = await PlanningAssistant.getInstance()
            .initMileStonesAndProjects(user, profile);
        const userContext = await UserContextBuilder.getInstance().build(user);

    }
}
