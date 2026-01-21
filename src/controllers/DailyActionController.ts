import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { DailyActionService } from "@/services/DailyActionService";

export class DailyActionController extends BaseController {
    private dailyActionService: DailyActionService;

    constructor() {
        super(null);
        this.dailyActionService = new DailyActionService();
    }

    /**
     * Get daily actions for the authenticated user
     * Query params:
     * - limit: number (optional, default: 10)
     * - createdDate: string (optional, YYYY-MM-DD format)
     */
    public async getDailyActions(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { limit, createdDate } = req.query;

            // Parse limit with default value
            const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

            // Validate limit
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                this.handleBadRequest(res, "Invalid limit parameter. Must be a positive number.");
                return;
            }

            // Validate createdDate format if provided
            if (createdDate && !/^\d{4}-\d{2}-\d{2}$/.test(createdDate as string)) {
                this.handleBadRequest(res, "Invalid createdDate format. Use YYYY-MM-DD.");
                return;
            }

            const dailyActions = await this.dailyActionService.getDailyActions(
                user,
                createdDate as string | undefined,
                parsedLimit
            );

            this.handleSuccess(res, dailyActions, "Daily actions retrieved successfully");
        } catch (error: any) {
            this.handleError(res, error, "Failed to retrieve daily actions");
        }
    }

    /**
     * Mark a daily action as completed
     * Route params:
     * - id: string (daily action ID)
     */
    public async completeDailyAction(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { id } = req.params;

            if (!id) {
                this.handleBadRequest(res, "Daily action ID is required");
                return;
            }

            const updatedAction = await this.dailyActionService.completeDailyAction(user, id);

            this.handleSuccess(res, updatedAction, "Daily action marked as completed");
        } catch (error: any) {
            this.handleError(res, error, "Failed to complete daily action");
        }
    }

    /**
     * Mark a daily action as incomplete
     * Route params:
     * - id: string (daily action ID)
     */
    public async uncompleteDailyAction(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { id } = req.params;

            if (!id) {
                this.handleBadRequest(res, "Daily action ID is required");
                return;
            }

            const updatedAction = await this.dailyActionService.uncompleteDailyAction(user, id);

            this.handleSuccess(res, updatedAction, "Daily action marked as incomplete");
        } catch (error: any) {
            this.handleError(res, error, "Failed to uncomplete daily action");
        }
    }
}
