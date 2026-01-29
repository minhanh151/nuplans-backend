import { Constant } from "@/constants/Constant";
import AppDataSource from "@/data-source";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { EventType } from "@/interfaces/event/EventType";
import { GenAllPlanEventData } from "@/interfaces/event/GenAllPlanEventData";
import { GenWeeklyPlanEventData } from "@/interfaces/event/GenWeeklyPlanEventData";
import { Milestone } from "@/models/Milestone";
import { Profile } from "@/models/Profile";
import { StoredEvent } from "@/models/StoredEvent";
import { User } from "@/models/User";
import logger from "@/utils/logger";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { EventHandler } from "./handlers/EventHandler";
import { UserContextBuilder } from "./UserContextBuilder";
import { LessThan, MoreThan } from "typeorm";
import { PlanGenerationStatus } from "@/interfaces/profile/PlanGenerationStatus";
import { SkillProfile } from "@/models/SkillProfile";

export class GenerateAllPlanService implements EventHandler {
    private static generateAllPlanService: GenerateAllPlanService;

    private userRepo = AppDataSource.getRepository(User);
    private storeEventRepo = AppDataSource.getRepository(StoredEvent);
    private profileRepo = AppDataSource.getRepository(Profile);
    private skillProfileRepo = AppDataSource.getRepository(SkillProfile);

    public static getInstance() {
        if (!GenerateAllPlanService.generateAllPlanService) {
            GenerateAllPlanService.generateAllPlanService = new GenerateAllPlanService();
        }
        return GenerateAllPlanService.generateAllPlanService;
    }

    public createEvent(data: GenAllPlanEventData) {
        const event = new StoredEvent();
        event.eventType = EventType.GEN_ALL_PLANS;
        event.eventData = data;
        event.status = EventStatus.PENDING;
        event.createdAt = new Date();
        return this.storeEventRepo.save(event);
    }

    public async processEvent(event: StoredEvent): Promise<void> {
        try {
            const planningAssistant = PlanningAssistant.getInstance();
            event.retryCount = event.retryCount + 1;
            const eventData = event.eventData as GenAllPlanEventData;
            const user = await this.userRepo.findOne({ where: { id: eventData.userId } });
            if (!user) {
                throw new Error("User not found");
            }
            const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                throw new Error("Profile not found");
            }
            const userContext = await UserContextBuilder.getInstance().build(user);
            const { projects } = await planningAssistant.generateProjects(user, profile);
            logger.info("Projects generated: ", projects.map(project => project.name));
            for (const project of projects) {
                const listMilestones = await planningAssistant.generateMilestones(user, profile, project);
                logger.info("Milestones generated: ", listMilestones.map(item => item.name))
            }
            profile.planGenerationStatus = PlanGenerationStatus.GENERATED;
            await this.profileRepo.save(profile);
            const weeklyPlan = await planningAssistant.generateWeeklyPlan(user, userContext, 1);
            if (new Date() >= weeklyPlan.startDate && new Date() <= weeklyPlan.deadline) {
                await planningAssistant.generateDailyActions(userContext, profile, weeklyPlan);
                logger.info("Daily actions generated: ", weeklyPlan.id);
            }
            event.status = EventStatus.COMPLETED;
        } catch (e: any) {
            logger.error("Error when processing event generate milestone's steps", e);
            if (event.retryCount >= Constant.MAX_RETRY_COUNT) {
                event.status = EventStatus.FAILED;
            } else {
                event.status = EventStatus.PENDING;
            }
        }
        this.storeEventRepo.save(event);
    }

    public async preCheckGenerateAllPlan(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        if (profile.planGenerationStatus != PlanGenerationStatus.NOT_GENERATED) {
            throw new Error("Plan is inprogress or already generated");
        }
        const skillProfile = await this.skillProfileRepo.findOne({ where: { profileId: profile.id } });
        if (!skillProfile) {
            throw new Error("Skill profile not found");
        }
    }

}