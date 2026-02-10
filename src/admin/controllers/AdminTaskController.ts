import { Response } from 'express';
import { AdminTaskService } from '../services/AdminTaskService';
import { StatusCodes } from 'http-status-codes';
import { AdminRequest } from '../middlewares/admin.middleware';

const adminTaskService = new AdminTaskService();

export class AdminTaskController {
    /**
     * Get pending milestones for admin's assigned users
     */
    static async getPendingMilestones(req: AdminRequest, res: Response) {
        try {
            const { status, userId, page, limit } = req.query;

            const result = await adminTaskService.getPendingMilestones(req.admin!.id, {
                status: status as string,
                userId: userId as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            });

            res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Get pending daily actions for admin's assigned users
     */
    static async getPendingDailyActions(req: AdminRequest, res: Response) {
        try {
            const { userId, page, limit } = req.query;

            const result = await adminTaskService.getPendingDailyActions(req.admin!.id, {
                userId: userId as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            });

            res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Get milestone detail
     */
    static async getMilestoneDetail(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const milestone = await adminTaskService.getMilestoneDetail(parseInt(id), req.admin!.id);
            res.status(StatusCodes.OK).json({ milestone });
        } catch (error: any) {
            if (error.message === 'Milestone not found' || error.message.includes('Access denied')) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            }
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Get daily action detail
     */
    static async getDailyActionDetail(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const action = await adminTaskService.getDailyActionDetail(parseInt(id), req.admin!.id);
            res.status(StatusCodes.OK).json({ action });
        } catch (error: any) {
            if (error.message === 'Daily action not found' || error.message.includes('Access denied')) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            }
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Approve milestone
     */
    static async approveMilestone(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const milestone = await adminTaskService.approveMilestone(parseInt(id), req.admin!.id);

            res.status(StatusCodes.OK).json({
                message: 'Milestone approved successfully',
                milestone
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Reject milestone
     */
    static async rejectMilestone(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const milestone = await adminTaskService.rejectMilestone(parseInt(id), req.admin!.id, reason);

            res.status(StatusCodes.OK).json({
                message: 'Milestone rejected',
                milestone
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Approve daily action
     */
    static async approveDailyAction(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const action = await adminTaskService.approveDailyAction(parseInt(id), req.admin!.id);

            res.status(StatusCodes.OK).json({
                message: 'Daily action approved successfully',
                action
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Reject daily action
     */
    static async rejectDailyAction(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const action = await adminTaskService.rejectDailyAction(parseInt(id), req.admin!.id, reason);

            res.status(StatusCodes.OK).json({
                message: 'Daily action rejected',
                action
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
