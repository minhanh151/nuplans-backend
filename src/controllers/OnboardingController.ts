import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { OnboardingService } from "../services/OnboardingService";

export class OnboardingController extends BaseController {
    private onboardingService: OnboardingService;

    constructor() {
        super(null);
        this.onboardingService = new OnboardingService();
    }

    public async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const profile = await this.onboardingService.getProfile(user);
            if (!profile) {
                this.handleBadRequest(res, "Profile not found", "PGRST116");
                return;
            }
            this.handleSuccess(res, { profile });
        } catch (error: any) {
            this.handleError(res, error, "Failed to get profile");
        }
    }

    public async saveOnboarding(req: Request, res: Response): Promise<void> {
        try {
            const body = req.body;
            const user = (req as any).user;

            const profile = await this.onboardingService.saveOnboarding(user, body);
            this.handleSuccess(res, { profile });
        } catch (error: any) {
            this.handleError(res, error, "Failed to save onboarding");
        }
    }

    public async saveCvProfile(req: Request, res: Response): Promise<void> {
        try {
            const body = req.body;
            const user = (req as any).user;

            const profile = await this.onboardingService.saveCvProfile(user, body);
            this.handleSuccess(res, { profile });
        } catch (error: any) {
            this.handleError(res, error, "Failed to save CV profile");
        }
    }
}
