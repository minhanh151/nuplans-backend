import { Response } from 'express';
import { AdminAuthService } from '../services/AdminAuthService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { sendSuccess, sendError, sendUnauthorized } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';
import logger from '@/utils/logger';

const adminAuthService = new AdminAuthService();

export class AdminAuthController {
    static async login(req: AdminRequest, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return sendError(res, 'Email and password are required', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            const result = await adminAuthService.login({ email, password });

            sendSuccess(res, result, 'Login successful');
        } catch (error: any) {
            logger.error("Login error: ", error);
            sendUnauthorized(res, error.message);
        }
    }

    static async refreshToken(req: AdminRequest, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return sendError(res, 'Refresh token is required', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            const { accessToken } = await adminAuthService.refreshAccessToken(refreshToken);

            sendSuccess(res, { accessToken }, 'Token refreshed successfully');
        } catch (error: any) {
            sendUnauthorized(res, error.message);
        }
    }

    static async changePassword(req: AdminRequest, res: Response) {
        try {
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return sendError(res, 'Old password and new password are required', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            if (newPassword.length < 6) {
                return sendError(res, 'New password must be at least 6 characters', 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
            }

            await adminAuthService.changePassword(req.admin!.id, oldPassword, newPassword);

            sendSuccess(res, null, 'Password changed successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async logout(req: AdminRequest, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                await adminAuthService.logout(refreshToken);
            }

            sendSuccess(res, null, 'Logged out successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }

    static async me(req: AdminRequest, res: Response) {
        try {
            sendSuccess(res, { admin: req.admin }, 'Admin profile retrieved');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}
