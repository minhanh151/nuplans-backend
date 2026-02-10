import { Response } from 'express';
import { AdminTaskService } from '../services/AdminTaskService';
import { StatusCodes } from 'http-status-codes';
import { AdminRequest } from '../middlewares/admin.middleware';

const adminTaskService = new AdminTaskService();

export class AdminDashboardController {
    /**
     * Get dashboard statistics
     */
    static async getStats(req: AdminRequest, res: Response) {
        try {
            const stats = await adminTaskService.getDashboardStats(req.admin!.id);
            res.status(StatusCodes.OK).json({ stats });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
