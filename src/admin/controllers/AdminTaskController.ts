import { Response } from 'express';
import { AdminTaskService } from '../services/AdminTaskService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { sendSuccess, sendError, sendNotFound } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

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

            sendSuccess(res, result, 'Pending milestones retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
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

            sendSuccess(res, result, 'Pending daily actions retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Get milestone detail
     */
    static async getMilestoneDetail(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const milestone = await adminTaskService.getMilestoneDetail(parseInt(id), req.admin!.id);
            sendSuccess(res, { milestone }, 'Milestone detail retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Milestone not found' || error.message.includes('Access denied')) {
                return sendNotFound(res, error.message);
            }
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Get daily action detail
     */
    static async getDailyActionDetail(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const action = await adminTaskService.getDailyActionDetail(parseInt(id), req.admin!.id);
            sendSuccess(res, { action }, 'Daily action detail retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Daily action not found' || error.message.includes('Access denied')) {
                return sendNotFound(res, error.message);
            }
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Approve milestone
     */
    static async approveMilestone(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const milestone = await adminTaskService.approveMilestone(parseInt(id), req.admin!.id);

            sendSuccess(res, { milestone }, 'Milestone approved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
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

            sendSuccess(res, { milestone }, 'Milestone rejected');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Approve daily action
     */
    static async approveDailyAction(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const action = await adminTaskService.approveDailyAction(parseInt(id), req.admin!.id);

            sendSuccess(res, { action }, 'Daily action approved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
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

            sendSuccess(res, { action }, 'Daily action rejected');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}
