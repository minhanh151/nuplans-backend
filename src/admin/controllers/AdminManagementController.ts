import { Response } from 'express';
import { AdminManagementService } from '../services/AdminManagementService';
import { StatusCodes } from 'http-status-codes';
import { AdminRequest } from '../middlewares/admin.middleware';
import { AdminRole } from '../models/Admin';

const adminManagementService = new AdminManagementService();

export class AdminManagementController {
    static async createAdmin(req: AdminRequest, res: Response) {
        try {
            const { email, password, name, role } = req.body;

            if (!email || !password) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Email and password are required'
                });
            }

            if (password.length < 6) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Password must be at least 6 characters'
                });
            }

            // Only master_admin can create another master_admin
            if (role === AdminRole.MASTER_ADMIN && req.admin!.role !== AdminRole.MASTER_ADMIN) {
                return res.status(StatusCodes.FORBIDDEN).json({
                    message: 'Only master admin can create another master admin'
                });
            }

            const admin = await adminManagementService.createAdmin({ email, password, name, role });

            res.status(StatusCodes.CREATED).json({
                message: 'Admin created successfully',
                admin
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async getAdmins(req: AdminRequest, res: Response) {
        try {
            const admins = await adminManagementService.getAdmins();
            res.status(StatusCodes.OK).json({ admins });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async getAdminById(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.getAdminById(id);
            res.status(StatusCodes.OK).json({ admin });
        } catch (error: any) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
        }
    }

    static async lockAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.lockAdmin(id, req.admin!.id);

            res.status(StatusCodes.OK).json({
                message: 'Admin locked successfully',
                admin
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async unlockAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const admin = await adminManagementService.unlockAdmin(id);

            res.status(StatusCodes.OK).json({
                message: 'Admin unlocked successfully',
                admin
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async resetPassword(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'New password is required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Password must be at least 6 characters'
                });
            }

            const admin = await adminManagementService.resetAdminPassword(id, newPassword, req.admin!.id);

            res.status(StatusCodes.OK).json({
                message: 'Password reset successfully',
                admin
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async deleteAdmin(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            await adminManagementService.deleteAdmin(id, req.admin!.id);

            res.status(StatusCodes.OK).json({
                message: 'Admin deleted successfully'
            });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
