import { Constant } from "@/constants/Constant";
import AppDataSource from "@/data-source";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { EventType } from "@/interfaces/event/EventType";
import { GenDailyActionEventData } from "@/interfaces/event/GenDailyActionEventData";
import { Profile } from "@/models/Profile";
import { StoredEvent } from "@/models/StoredEvent";
import { User } from "@/models/User";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import logger from "@/utils/logger";
import { PlanningAssistant } from "./assistant/PlanningAssistant";
import { EventHandler } from "./handlers/EventHandler";
import { UserContextBuilder } from "./UserContextBuilder";
import { LessThan, MoreThan } from "typeorm";
import { Milestone } from "@/models/Milestone";

export class GenerateDailyActionService implements EventHandler {
    private static generateDailyActionService: GenerateDailyActionService;

    private storeEventRepo = AppDataSource.getRepository(StoredEvent);
    private userRepo = AppDataSource.getRepository(User);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);
    private profileRepo = AppDataSource.getRepository(Profile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);

    public static getInstance() {
        if (!GenerateDailyActionService.generateDailyActionService) {
            GenerateDailyActionService.generateDailyActionService = new GenerateDailyActionService();
        }
        return GenerateDailyActionService.generateDailyActionService;
    }

    public createEvent(data: any) {
        const event = new StoredEvent();
        event.eventType = EventType.GEN_DAILY_ACTION;
        event.eventData = data;
        event.status = EventStatus.PENDING;
        event.createdAt = new Date();
        return this.storeEventRepo.save(event);
    }

    public async processEvent(event: StoredEvent): Promise<void> {
        try {
            event.retryCount = event.retryCount + 1;
            const eventData = event.eventData as GenDailyActionEventData;
            const user = await this.userRepo.findOne({ where: { id: eventData.userId } });
            if (!user) {
                throw new Error("User not found");
            }
            const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                throw new Error("Profile not found");
            }
            const weeklyPlan = await this.weeklyPlanRepo.findOne({ where: { id: eventData.weeklyPlanId } });
            if (!weeklyPlan) {
                throw new Error("Weekly plan not found");
            }
            const userContext = await UserContextBuilder.getInstance().build(user);

            await PlanningAssistant.getInstance().generateDailyActions(userContext, profile, weeklyPlan);
            event.status = EventStatus.COMPLETED;
        } catch (e: any) {
            logger.error("Error when processing event generate daily actions", e);
            if (event.retryCount >= Constant.MAX_RETRY_COUNT) {
                event.status = EventStatus.FAILED;
            } else {
                event.status = EventStatus.PENDING;
            }
        }
        this.storeEventRepo.save(event);
    }

    public async genDailyActions() {
        logger.info("Generating daily actions");
        const planningAssistant = PlanningAssistant.getInstance();
        const listWeeklyPlans = await this.weeklyPlanRepo.find({
            where: {
                startDate: LessThan(new Date()),
                deadline: MoreThan(new Date())
            }
        });
        logger.info("Found " + listWeeklyPlans.length + " weekly plans");
        for (const weeklyPlan of listWeeklyPlans) {
            const user = await this.userRepo.findOne({ where: { id: weeklyPlan.userId } });
            if (!user) {
                throw new Error("User not found");
            }
            const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                throw new Error("Profile not found");
            }
            const userContext = await UserContextBuilder.getInstance().build(user);
            await planningAssistant.generateDailyActions(userContext, profile, weeklyPlan);
        }
    }
}