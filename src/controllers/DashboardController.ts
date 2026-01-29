import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { DashboardService } from "../services/DashboardService";
import { WeeklyPlanningGenerator } from "@/services/WeeklyPlanningGenerator";
import logger from "@/utils/logger";

export class DashboardController extends BaseController {
    private dashboardService: DashboardService;

    constructor() {
        super(null);
        this.dashboardService = new DashboardService();
    }

    public async generate(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const data = await this.dashboardService.generateDashboardData(user);
            this.handleSuccess(res, data, "Your roadmap is in progress...");
        } catch (error: any) {
            logger.error("Error when generating dashboard data", error);
            const mess = error.message ? error.message : "Failed to generate dashboard data";
            this.handleError(res, error, mess);
        }
    }

    public async generateWeeklyPlan(req: Request, res: Response): Promise<void> {
        try {
            await WeeklyPlanningGenerator.getInstance().runWeeklyGeneration();
            this.handleSuccess(res, { message: "Weekly plan generation triggered" });
        } catch (error: any) {
            logger.error("Error when generating weekly plan", error);
            const mess = error.message ? error.message : "Failed to trigger weekly plan generation";
            this.handleError(res, error, mess);
        }
    }
}
