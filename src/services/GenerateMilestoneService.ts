import AppDataSource from "@/data-source";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { EventType } from "@/interfaces/event/EventType";
import { GenMilestoneEventData } from "@/interfaces/event/GenMilestoneEventData";
import { StoredEvent } from "@/models/StoredEvent";
import { User } from "@/models/User";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { Project } from "@/models/Project";
import { Profile } from "@/models/Profile";
import logger from "@/utils/logger";
import { Constant } from "@/constants/Constant";
import { EventHandler } from "./handlers/EventHandler";

export class GenerateMilestoneService implements EventHandler {
    private static generateMilestoneService: GenerateMilestoneService;

    private userRepo = AppDataSource.getRepository(User);
    private storeEventRepo = AppDataSource.getRepository(StoredEvent);
    private projectRepo = AppDataSource.getRepository(Project);
    private profileRepo = AppDataSource.getRepository(Profile);

    public static getInstance() {
        if (!GenerateMilestoneService.generateMilestoneService) {
            GenerateMilestoneService.generateMilestoneService = new GenerateMilestoneService();
        }
        return GenerateMilestoneService.generateMilestoneService;
    }

    public createEvent(data: GenMilestoneEventData) {
        const event = new StoredEvent();
        event.eventType = EventType.GEN_MILESTONE;
        event.eventData = data;
        event.status = EventStatus.PENDING;
        event.createdAt = new Date();
        return this.storeEventRepo.save(event);
    }

    /**
     * Process event type GEN_MILESTONE only
     * @param event 
     * @returns 
     */
    public async processEvent(event: StoredEvent): Promise<void> {
        try {
            event.retryCount = event.retryCount + 1;
            const eventData = event.eventData as GenMilestoneEventData;
            const user = await this.userRepo.findOne({ where: { id: eventData.userId } });
            if (!user) {
                throw new Error("User not found");
            }
            const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                throw new Error("Profile not found");
            }
            const project = await this.projectRepo.findOne({ where: { id: eventData.projectId } });
            if (!project) {
                throw new Error("Project not found");
            }
            await PlanningAssistant.getInstance().generateMilestones(user, profile, project);
        } catch (e: any) {
            logger.error("Error when processing event generate milestones", e);
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