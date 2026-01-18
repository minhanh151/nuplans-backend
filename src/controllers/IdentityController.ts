import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { IdentityService } from "../services/IdentityService";

export class IdentityController extends BaseController {
    private identityService: IdentityService;

    constructor() {
        super(null);
        this.identityService = new IdentityService();
    }

    public async verifyIdentity(req: Request, res: Response): Promise<void> {
        try {
            const { photoIdPath, selfiePath } = req.body;
            const user = (req as any).user;

            const result = await this.identityService.verifyIdentity(user, photoIdPath, selfiePath);
            this.handleSuccess(res, { success: true, result });
        } catch (error: any) {
            this.handleError(res, error, "Failed to verify identity");
        }
    }
}
