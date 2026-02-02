import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { MilestoneService } from "@/services/MilestoneService";

export class MilestoneController extends BaseController {
    private milestoneService: MilestoneService;

    constructor() {
        super(null);
        this.milestoneService = new MilestoneService();
    }

    /**
     * Get milestones for the authenticated user
     * Query params:
     * - limit: number (optional, default: 10)
     * - maxDeadline: string (optional, YYYY-MM-DD format)
     * - status: string (optional)
     */
    public async getMilestones(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { limit, maxDeadline, status } = req.query;

            // Parse limit with default value
            const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

            // Validate limit
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                this.handleBadRequest(res, "Invalid limit parameter. Must be a positive number.");
                return;
            }

            // Validate maxDeadline format if provided
            if (maxDeadline && !/^\d{4}-\d{2}-\d{2}$/.test(maxDeadline as string)) {
                this.handleBadRequest(res, "Invalid maxDeadline format. Use YYYY-MM-DD.");
                return;
            }

            const milestones = await this.milestoneService.getMilestones(
                user,
                maxDeadline as string | undefined,
                status as string | undefined,
                parsedLimit
            );

            this.handleSuccess(res, milestones, "Milestones retrieved successfully");
        } catch (error: any) {
            this.handleError(res, error, "Failed to retrieve milestones");
        }
    }

    /**
     * Get milestone detail with steps
     * Route params:
     * - id: string (milestone ID)
     */
    public async getMilestoneDetail(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { id } = req.params;

            if (!id) {
                this.handleBadRequest(res, "Milestone ID is required");
                return;
            }

            const result = await this.milestoneService.getMilestoneDetail(user, Number(id));

            this.handleSuccess(res, result, "Milestone detail retrieved successfully");
        } catch (error: any) {
            this.handleError(res, error, "Failed to retrieve milestone detail");
        }
    }

    /**
     * Mark a milestone step as completed
     * Route params:
     * - stepId: string (milestone step ID)
     */
    public async completeStep(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { stepId } = req.params;

            if (!stepId) {
                this.handleBadRequest(res, "Step ID is required");
                return;
            }

            const result = await this.milestoneService.completeStep(user, Number(stepId));

            this.handleSuccess(res, result, "Milestone step marked as completed");
        } catch (error: any) {
            this.handleError(res, error, "Failed to complete milestone step");
        }
    }

    /**
     * Mark a milestone step as uncompleted
     * Route params:
     * - stepId: string (milestone step ID)
     */
    public async uncompleteStep(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { stepId } = req.params;

            if (!stepId) {
                this.handleBadRequest(res, "Step ID is required");
                return;
            }

            const result = await this.milestoneService.uncompleteStep(user, Number(stepId));

            this.handleSuccess(res, result, "Milestone step marked as uncompleted");
        } catch (error: any) {
            this.handleError(res, error, "Failed to uncomplete milestone step");
        }
    }

    /**
     * Submit milestone for review
     * Route params:
     * - id: string (milestone ID)
     * Body:
     * - fileUrl: string (evidence file URL - text/image/video)
     */
    public async submitReview(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { id } = req.params;
            const { fileUrl } = req.body;

            if (!id) {
                this.handleBadRequest(res, "Milestone ID is required");
                return;
            }

            if (!fileUrl) {
                this.handleBadRequest(res, "File URL is required");
                return;
            }

            const result = await this.milestoneService.submitReview(user, Number(id), fileUrl);

            this.handleSuccess(res, result, "Milestone submitted for review successfully");
        } catch (error: any) {
            this.handleError(res, error, "Failed to submit milestone for review");
        }
    }
}
