import { Constant } from "@/constants/Constant";
import AppDataSource from "@/data-source";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { EventType } from "@/interfaces/event/EventType";
import { GenWeeklyPlanEventData } from "@/interfaces/event/GenWeeklyPlanEventData";
import { Milestone } from "@/models/Milestone";
import { Profile } from "@/models/Profile";
import { StoredEvent } from "@/models/StoredEvent";
import { User } from "@/models/User";
import logger from "@/utils/logger";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { EventHandler } from "./handlers/EventHandler";
import { UserContextBuilder } from "./UserContextBuilder";

export class GenerateWeeklyPlanService implements EventHandler {
    private static generateWeeklyPlanService: GenerateWeeklyPlanService;

    private userRepo = AppDataSource.getRepository(User);
    private storeEventRepo = AppDataSource.getRepository(StoredEvent);
    private profileRepo = AppDataSource.getRepository(Profile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);

    public static getInstance() {
        if (!GenerateWeeklyPlanService.generateWeeklyPlanService) {
            GenerateWeeklyPlanService.generateWeeklyPlanService = new GenerateWeeklyPlanService();
        }
        return GenerateWeeklyPlanService.generateWeeklyPlanService;
    }

    public createEvent(data: GenWeeklyPlanEventData) {
        const event = new StoredEvent();
        event.eventType = EventType.GEN_WEEKLY_PLAN;
        event.eventData = data;
        event.status = EventStatus.PENDING;
        event.createdAt = new Date();
        return this.storeEventRepo.save(event);
    }

    public async processEvent(event: StoredEvent): Promise<void> {
        try {
            event.retryCount = event.retryCount + 1;
            const eventData = event.eventData as GenWeeklyPlanEventData;
            const user = await this.userRepo.findOne({ where: { id: eventData.userId } });
            if (!user) {
                throw new Error("User not found");
            }
            const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                throw new Error("Profile not found");
            }
            const milestone = await this.milestoneRepo.findOne({ where: { id: eventData.milestoneId } });
            if (!milestone) {
                throw new Error("Milestone not found");
            }
            const userContext = await UserContextBuilder.getInstance().build(user);

            await PlanningAssistant.getInstance().generateWeeklyPlan(user, userContext, eventData.weekNumber, milestone);
        } catch (e: any) {
            logger.error("Error when processing event generate milestone's steps", e);
            if (event.retryCount >= Constant.MAX_RETRY_COUNT) {
                event.status = EventStatus.FAILED;
            } else {
                event.status = EventStatus.PENDING;
            }
        }
        event.status = EventStatus.COMPLETED;
        this.storeEventRepo.save(event);
    }

}