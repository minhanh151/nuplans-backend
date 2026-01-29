import AppDataSource from "@/data-source";
import { PlanGenerationStatus } from "@/interfaces/profile/PlanGenerationStatus";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { GenerateAllPlanService } from "./GenerateAllPlanService";

export class DashboardService {
    private profileRepo = AppDataSource.getRepository(Profile);

    public async generateDashboardData(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            throw new Error("Profile not found. Cannot build dashboard");
        }
        await GenerateAllPlanService.getInstance().preCheckGenerateAllPlan(user);
        await GenerateAllPlanService.getInstance().createEvent({ userId: user.id });
        profile.planGenerationStatus = PlanGenerationStatus.GENERATING;
        await this.profileRepo.save(profile);
    }
}
