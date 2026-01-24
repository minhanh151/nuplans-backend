import cron from "node-cron";
import { randomUUID } from "crypto";
import { WeeklyPlanningGenerator } from "../services/WeeklyPlanningGenerator";
import logger from "@/utils/logger";
import { runWithContext } from "@/utils/context";
import AppDataSource from "@/data-source";
import { StoredEvent } from "@/models/StoredEvent";
import { EventType } from "@/interfaces/event/EventType";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { In, LessThan } from "typeorm";
import { GenerateDailyActionService } from "@/services/GenerateDailyActionService";
import { GenerateMilestoneService } from "@/services/GenerateMilestoneService";
import { GenerateMilestoneStepService } from "@/services/GenerateMilestoneStepService";
import { GenerateWeeklyPlanService } from "@/services/GenerateWeeklyPlanService";
import { GenerateAllPlanService } from "@/services/GenerateAllPlanService";

export class CronJobRunner {
    private static instance: CronJobRunner;

    private storedEventRepo = AppDataSource.getRepository(StoredEvent);

    private isEventProcessingRunning = false;

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

        cron.schedule("* * * * *", async () => {
            if (this.isEventProcessingRunning) {
                logger.info("Previous event processing is still running.");
                return;
            }
            this.isEventProcessingRunning = true;
            try {
                const traceId = randomUUID();
                await runWithContext({ traceId }, async () => {
                    const storedEvents = await this.storedEventRepo.find({
                        where: {
                            eventType: In([EventType.GEN_WEEKLY_PLAN, EventType.GEN_DAILY_ACTION, EventType.GEN_MILESTONE, EventType.GEN_MILESTONE_STEP, EventType.GEN_ALL_PLANS]),
                            status: EventStatus.PENDING,
                            retryCount: LessThan(3)
                        }
                    });
                    logger.info("Running scheduled events processing for " + storedEvents.length + " events");
                    const updatedEvents = storedEvents.map((event) => {
                        event.status = EventStatus.PROCESSING;
                        return event;
                    });
                    await this.storedEventRepo.save(updatedEvents);
                    for (const storedEvent of storedEvents) {
                        storedEvent.status = EventStatus.PROCESSING;
                        await this.storedEventRepo.save(storedEvent);
                        switch (storedEvent.eventType) {
                            case EventType.GEN_WEEKLY_PLAN:
                                await GenerateWeeklyPlanService.getInstance().processEvent(storedEvent);
                                break;
                            case EventType.GEN_DAILY_ACTION:
                                await GenerateDailyActionService.getInstance().processEvent(storedEvent);
                                break;
                            case EventType.GEN_MILESTONE:
                                await GenerateMilestoneService.getInstance().processEvent(storedEvent);
                                break;
                            case EventType.GEN_MILESTONE_STEP:
                                await GenerateMilestoneStepService.getInstance().processEvent(storedEvent);
                                break;
                            case EventType.GEN_ALL_PLANS:
                                await GenerateAllPlanService.getInstance().processEvent(storedEvent);
                                break;
                            default:
                                logger.info("Unknown event type: " + storedEvent.eventType);
                                storedEvent.status = EventStatus.FAILED;
                                await this.storedEventRepo.save(storedEvent);
                                break;
                        }
                    }
                });
            } catch (error) {
                logger.error("Failed to process events", error);
            } finally {
                this.isEventProcessingRunning = false;
            }
        });

        // Schedule weekly plans generation
        cron.schedule("12 0 * * *", async () => {
            const traceId = randomUUID();
            await runWithContext({ traceId }, async () => {
                GenerateWeeklyPlanService.getInstance().generateWeeklyPlans();
            });
        });

        // Schedule daily actions generation
        cron.schedule("12 0 * * *", async () => {
            const traceId = randomUUID();
            await runWithContext({ traceId }, async () => {
                GenerateDailyActionService.getInstance().genDailyActions();
            });
        });

        logger.info("Cron jobs scheduled successfully.");
    }
}
