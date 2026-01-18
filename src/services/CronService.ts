import cron from "node-cron";
import { randomUUID } from "crypto";
import { WeeklyPlanningGenerator } from "./WeeklyPlanningGenerator";
import logger from "@/utils/logger";
import { runWithContext } from "@/utils/context";

export class CronService {
    private static instance: CronService;

    public static getInstance(): CronService {
        if (!CronService.instance) {
            CronService.instance = new CronService();
        }
        return CronService.instance;
    }

    /**
     * Initializes all cron jobs for the application.
     */
    public init(): void {
        logger.info("Initializing CronService...");

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

        logger.info("Cron jobs scheduled successfully.");
    }
}
