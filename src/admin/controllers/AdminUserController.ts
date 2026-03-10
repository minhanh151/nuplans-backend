import { Response } from 'express';
import { AdminUserService } from '../services/AdminUserService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { AdminRole } from '../models/Admin';
import { sendSuccess, sendError, sendForbidden } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

const adminUserService = new AdminUserService();

export class AdminUserController {
    /**
     * Get users assigned to the current admin
     */
    static async getAssignedUsers(req: AdminRequest, res: Response) {
        try {
            const users = await adminUserService.getAssignedUsers(req.admin!.id);
            sendSuccess(res, [...users], 'Assigned users retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Get all users (master admin only)
     */
    static async getAllUsers(req: AdminRequest, res: Response) {
        try {
            const users = await adminUserService.getAllUsers();
            sendSuccess(res, { users }, 'All users retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Assign user to admin
     */
    static async assignUser(req: AdminRequest, res: Response) {
        try {
            const { userId } = req.params;
            const { adminId } = req.body;

            // If no adminId provided, assign to current admin
            const targetAdminId = adminId || req.admin!.id;

            // Only master admin can assign users to other admins
            if (adminId && adminId !== req.admin!.id && req.admin!.role !== AdminRole.MASTER_ADMIN) {
                return sendForbidden(res, 'Only master admin can assign users to other admins');
            }

            const assignment = await adminUserService.assignUserToAdmin(targetAdminId, userId);

            sendSuccess(res, { assignment }, 'User assigned successfully', StatusCodes.CREATED);
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Unassign user from admin
     */
    static async unassignUser(req: AdminRequest, res: Response) {
        try {
            const { userId } = req.params;
            const { adminId } = req.body;

            // If no adminId provided, unassign from current admin
            const targetAdminId = adminId || req.admin!.id;

            // Only master admin can unassign users from other admins
            if (adminId && adminId !== req.admin!.id && req.admin!.role !== AdminRole.MASTER_ADMIN) {
                return sendForbidden(res, 'Only master admin can unassign users from other admins');
            }

            await adminUserService.unassignUserFromAdmin(targetAdminId, userId);

            sendSuccess(res, null, 'User unassigned successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}
