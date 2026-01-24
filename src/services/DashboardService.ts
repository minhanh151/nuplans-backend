import AppDataSource from "@/data-source";
import { Profile } from "@/models/Profile";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { GenerateAllPlanService } from "./GenerateAllPlanService";

export class DashboardService {
    private profileRepo = AppDataSource.getRepository(Profile);
    private projectRepo = AppDataSource.getRepository(Project);

    public async generateDashboardData(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        const project = await this.projectRepo.findOne({ where: { userId: user.id } });
        if (project) {
            return;
        }
        await GenerateAllPlanService.getInstance().createEvent({ userId: user.id });
    }
}
