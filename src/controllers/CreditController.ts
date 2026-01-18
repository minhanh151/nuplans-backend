import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { CreditService } from "../services/CreditService";
import { StatusCodes } from "http-status-codes";

export class CreditController extends BaseController {
    private creditService: CreditService;

    constructor() {
        super(null);
        this.creditService = new CreditService();
    }

    public async calculateCredit(req: Request, res: Response): Promise<void> {
        try {
            const { profileData } = req.body;
            const user = (req as any).user;

            if (!profileData) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "profileData is required" });
                return;
            }

            const creditResult = await this.creditService.calculateCredit(user, profileData);
            this.handleSuccess(res, creditResult);
        } catch (error: any) {
            this.handleError(res, error, "Failed to calculate credit");
        }
    }

    public async getLatestAssessment(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const assessment = await this.creditService.getLatestAssessment(user);
            if (!assessment) {
                this.handleBadRequest(res, "No credit assessment found");
                return;
            }
            this.handleSuccess(res, assessment);
        } catch (error: any) {
            this.handleError(res, error, "Failed to fetch credit assessment");
        }
    }
}
