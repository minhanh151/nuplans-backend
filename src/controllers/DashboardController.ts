import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { DashboardService } from "../services/DashboardService";
import { WeeklyPlanningService } from "@/services/WeeklyPlanningGenerator";

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
            this.handleError(res, error, "Failed to generate dashboard data");
        }
    }

    public async generateWeeklyPlan(req: Request, res: Response): Promise<void> {
        try {
            await WeeklyPlanningService.getInstance().runWeeklyGeneration();
            this.handleSuccess(res, { message: "Weekly plan generation triggered" });
        } catch (error: any) {
            this.handleError(res, error, "Failed to trigger weekly plan generation");
        }
    }
}
