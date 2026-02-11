import { Response } from 'express';
import { AdminTaskService } from '../services/AdminTaskService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

const adminTaskService = new AdminTaskService();

export class AdminDashboardController {
    /**
     * Get dashboard statistics
     */
    static async getStats(req: AdminRequest, res: Response) {
        try {
            const stats = await adminTaskService.getDashboardStats(req.admin!.id);
            sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}
