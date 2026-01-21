import AppDataSource from "@/data-source";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { EventType } from "@/interfaces/event/EventType";
import { GenMilestoneEventData } from "@/interfaces/event/GenMilestoneEventData";
import { Milestone } from "@/models/Milestone";
import { StoredEvent } from "@/models/StoredEvent";
import { UserContextBuilder } from "./UserContextBuilder";
import { User } from "@/models/User";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { GenMilestoneStepEventData } from "@/interfaces/event/GenMilestoneStepEventData";
import { Constant } from "@/constants/Constant";
import logger from "@/utils/logger";
import { Profile } from "@/models/Profile";
import { EventHandler } from "./handlers/EventHandler";

export class GenerateMilestoneStepService implements EventHandler {
    private static generateMilestoneStepService: GenerateMilestoneStepService;

    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private userRepo = AppDataSource.getRepository(User);
    private storeEventRepo = AppDataSource.getRepository(StoredEvent);
    private profileRepo = AppDataSource.getRepository(Profile);

    public static getInstance() {
        if (!GenerateMilestoneStepService.generateMilestoneStepService) {
            GenerateMilestoneStepService.generateMilestoneStepService = new GenerateMilestoneStepService();
        }
        return GenerateMilestoneStepService.generateMilestoneStepService;
    }

    public createEvent(data: GenMilestoneEventData) {
        const event = new StoredEvent();
        event.eventType = EventType.GEN_MILESTONE_STEP;
        event.eventData = data;
        event.status = EventStatus.PENDING;
        event.createdAt = new Date();
        return this.storeEventRepo.save(event);
    }

    public async processEvent(event: StoredEvent): Promise<void> {
        try {
            event.retryCount = event.retryCount + 1;
            const eventData = event.eventData as GenMilestoneStepEventData;
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

            await PlanningAssistant.getInstance().generateMilestoneSteps(userContext, profile, milestone);
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