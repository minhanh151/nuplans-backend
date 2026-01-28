import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { ChatService } from "../services/ChatService";
import logger from "@/utils/logger";

export class ChatController extends BaseController {
    private chatService: ChatService;

    constructor() {
        super(null);
        this.chatService = new ChatService();
    }


    public async getThreads(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const groups = await this.chatService.getThreads(user);
            logger.info("groups:", { groups });
            this.handleSuccess(res, { groups });
        } catch (error: any) {
            this.handleError(res, error, "Failed to fetch threads");
        }
    }

    public async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { threadId, content } = req.body;
            const user = (req as any).user;

            const result = await this.chatService.sendMessage(user, threadId, content);
            this.handleSuccess(res, result);
        } catch (error: any) {
            if (error.message === "Thread not found") {
                this.handleBadRequest(res, error.message);
            } else {
                this.handleError(res, error, "Failed to send message");
            }
        }
    }

    public async getChatHistory(req: Request, res: Response): Promise<void> {
        try {
            const { threadId } = req.params;
            const { limit, page } = req.query;
            const user = (req as any).user;

            const result = await this.chatService.getChatHistory(
                user,
                threadId,
                limit ? parseInt(limit as string) : 20,
                page ? parseInt(page as string) : 1
            );
            this.handleSuccess(res, result);
        } catch (error: any) {
            if (error.message === "Thread not found") {
                this.handleBadRequest(res, error.message);
            } else {
                this.handleError(res, error, "Failed to fetch chat history");
            }
        }
    }

    public async archiveThread(req: Request, res: Response): Promise<void> {
        try {
            const { threadId } = req.body;
            const user = (req as any).user;

            const result = await this.chatService.archiveThread(user, threadId);
            this.handleSuccess(res, result);
        } catch (error: any) {
            if (error.message === "Thread not found") {
                this.handleBadRequest(res, error.message);
            } else {
                this.handleError(res, error, "Failed to archive thread");
            }
        }
    }

    public async unarchiveThread(req: Request, res: Response): Promise<void> {
        try {
            const { threadId } = req.body;
            const user = (req as any).user;

            const result = await this.chatService.unarchiveThread(user, threadId);
            this.handleSuccess(res, result);
        } catch (error: any) {
            if (error.message === "Thread not found") {
                this.handleBadRequest(res, error.message);
            } else {
                this.handleError(res, error, "Failed to unarchive thread");
            }
        }
    }
}
