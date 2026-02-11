import { Response } from 'express';
import { AdminManagementService } from '../services/AdminManagementService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { AdminRole } from '../models/Admin';
import { sendSuccess, sendError, sendForbidden, sendNotFound } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

const adminManagementService = new AdminManagementService();

export class AdminManagementController {
    static async createAdmin(req: AdminRequest, res: Response) {
        try {
            const { email, password, name, role } = req.body;

            if (!email || !password) {
                return sendError(res, 'Email and password are required', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            if (password.length < 6) {
                return sendError(res, 'Password must be at least 6 characters', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            // Only master_admin can create another master_admin
            if (role === AdminRole.MASTER_ADMIN && req.admin!.role !== AdminRole.MASTER_ADMIN) {
                return sendForbidden(res, 'Only master admin can create another master admin');
            }

            const admin = await adminManagementService.createAdmin({ email, password, name, role });

            sendSuccess(res, { admin }, 'Admin created successfully', StatusCodes.CREATED);
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async getAdmins(req: AdminRequest, res: Response) {
        try {
            const admins = await adminManagementService.getAdmins();
            sendSuccess(res, { admins }, 'Admins retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async getAdminById(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.getAdminById(id);
            sendSuccess(res, { admin }, 'Admin retrieved successfully');
        } catch (error: any) {
            sendNotFound(res, error.message);
        }
    }

    static async lockAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.lockAdmin(id, req.admin!.id);

            sendSuccess(res, { admin }, 'Admin locked successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async unlockAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.unlockAdmin(id);

            sendSuccess(res, { admin }, 'Admin unlocked successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async resetPassword(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                return sendError(res, 'New password is required', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            if (newPassword.length < 6) {
                return sendError(res, 'Password must be at least 6 characters', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            const admin = await adminManagementService.resetAdminPassword(id, newPassword, req.admin!.id);

            sendSuccess(res, { admin }, 'Password reset successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async deleteAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            await adminManagementService.deleteAdmin(id, req.admin!.id);

            sendSuccess(res, null, 'Admin deleted successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}
