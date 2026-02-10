import { Response } from 'express';
import { AdminUserService } from '../services/AdminUserService';
import { StatusCodes } from 'http-status-codes';
import { AdminRequest } from '../middlewares/admin.middleware';
import { AdminRole } from '../models/Admin';

const adminUserService = new AdminUserService();

export class AdminUserController {
    /**
     * Get users assigned to the current admin
     */
    static async getAssignedUsers(req: AdminRequest, res: Response) {
        try {
            const users = await adminUserService.getAssignedUsers(req.admin!.id);
            res.status(StatusCodes.OK).json({ users });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    /**
     * Get all users (master admin only)
     */
    static async getAllUsers(req: AdminRequest, res: Response) {
        try {
            const users = await adminUserService.getAllUsers();
            res.status(StatusCodes.OK).json({ users });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
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
                return res.status(StatusCodes.FORBIDDEN).json({
                    message: 'Only master admin can assign users to other admins'
                });
            }

            const assignment = await adminUserService.assignUserToAdmin(targetAdminId, userId);

            res.status(StatusCodes.CREATED).json({
                message: 'User assigned successfully',
                assignment
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
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
                return res.status(StatusCodes.FORBIDDEN).json({
                    message: 'Only master admin can unassign users from other admins'
                });
            }

            await adminUserService.unassignUserFromAdmin(targetAdminId, userId);

            res.status(StatusCodes.OK).json({
                message: 'User unassigned successfully'
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
