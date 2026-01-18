import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { CVService } from "../services/CVService";
import { StatusCodes } from "http-status-codes";

export class CVController extends BaseController {
    private cvService: CVService;

    constructor() {
        super(null);
        this.cvService = new CVService();
    }

    public async parseCV(req: Request, res: Response): Promise<void> {
        try {
            const { filePath } = req.body;
            if (!filePath) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "filePath is required" });
                return;
            }

            const extractedData = await this.cvService.parseCV(filePath);

            this.handleSuccess(res, { extractedData });
        } catch (error: any) {
            this.handleError(res, error, "Failed to parse CV");
        }
    }
}
