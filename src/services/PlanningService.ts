import { User } from "@/models/User";
import AppDataSource from "@/data-source";
import { Milestone } from "@/models/Milestone";
import { Project } from "@/models/Project";
import { WeeklyPlan } from "@/models/WeeklyPlan";

export class PlanningService {
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private projectRepo = AppDataSource.getRepository(Project);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);

    public async getAllPlans(user: User) {
        const listMilestone = await this.milestoneRepo.find({ where: { userId: user.id } });
        const listProject = await this.projectRepo.find({ where: { userId: user.id } });
        const listWeeklyPlan = await this.weeklyPlanRepo.find({ where: { userId: user.id } });

    }
}