import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { StorageService } from "../services/storage/StorageService";
import { StatusCodes } from "http-status-codes";

export class StorageController extends BaseController {
    private storageService: StorageService;

    constructor() {
        super(null);
        this.storageService = StorageService.getInstance();
    }

    public async uploadCV(req: Request, res: Response): Promise<void> {
        try {
            const file = req.file;
            const user = (req as any).user;

            if (!file) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "No file uploaded" });
                return;
            }

            const filePath = `${user.id}/${Date.now()}-${file.originalname}`;
            await this.storageService.uploadFile(filePath, file.buffer, file.mimetype);

            this.handleSuccess(res, { filePath });
        } catch (error: any) {
            this.handleError(res, error, "Failed to upload CV");
        }
    }
}
