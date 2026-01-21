import cron from "node-cron";
import { randomUUID } from "crypto";
import { WeeklyPlanningGenerator } from "../services/WeeklyPlanningGenerator";
import logger from "@/utils/logger";
import { runWithContext } from "@/utils/context";
import AppDataSource from "@/data-source";
import { StoredEvent } from "@/models/StoredEvent";
import { EventType } from "@/interfaces/event/EventType";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { LessThan } from "typeorm";
import { GenerateDailyActionService } from "@/services/GenerateDailyActionService";
import { GenerateMilestoneService } from "@/services/GenerateMilestoneService";
import { GenerateMilestoneStepService } from "@/services/GenerateMilestoneStepService";
import { GenerateWeeklyPlanService } from "@/services/GenerateWeeklyPlanService";

export class CronJobRunner {
    private static instance: CronJobRunner;

    private storedEventRepo = AppDataSource.getRepository(StoredEvent);

    public static getInstance(): CronJobRunner {
        if (!CronJobRunner.instance) {
            CronJobRunner.instance = new CronJobRunner();
        }
        return CronJobRunner.instance;
    }

    /**
     * Initializes all cron jobs for the application.
     */
    public init(): void {
        logger.info("Initializing CronJobRunner...");

        // Schedule weekly plan generation
        // Format: minute hour dayOfMonth month dayOfWeek
        // "0 0 * * 1" runs every Monday at 00:00
        cron.schedule("0 0 * * 1", async () => {
            const traceId = randomUUID();
            await runWithContext({ traceId }, async () => {
                logger.info("Running scheduled weekly plan generation...");
                await WeeklyPlanningGenerator.getInstance().runWeeklyGeneration();
            });
        });

        // Schedule planning generation
        cron.schedule("* * * * 1", async () => {
            const traceId = randomUUID();
            await runWithContext({ traceId }, async () => {
                const storedEvents = await this.storedEventRepo.find({
                    where: {
                        status: EventStatus.PENDING,
                        retryCount: LessThan(3)
                    }
                });
                logger.info("Running scheduled planning generation...");
                for (const storedEvent of storedEvents) {
                    storedEvent.status = EventStatus.PROCESSING;
                    await this.storedEventRepo.save(storedEvent);
                    switch (storedEvent.eventType) {
                        case EventType.GEN_DAILY_ACTION:
                            await GenerateDailyActionService.getInstance().processEvent(storedEvent);
                            break;
                        case EventType.GEN_MILESTONE:
                            await GenerateMilestoneService.getInstance().processEvent(storedEvent);
                            break;
                        case EventType.GEN_MILESTONE_STEP:
                            await GenerateMilestoneStepService.getInstance().processEvent(storedEvent);
                            break;
                        case EventType.GEN_WEEKLY_PLAN:
                            await GenerateWeeklyPlanService.getInstance().processEvent(storedEvent);
                            break;
                        default:
                            logger.error("Unknown event type: " + storedEvent.eventType);
                            break;
                    }
                }
            });
        });

        logger.info("Cron jobs scheduled successfully.");
    }
}
