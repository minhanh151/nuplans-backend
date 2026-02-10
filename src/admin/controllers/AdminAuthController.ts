import { Response } from 'express';
import { AdminAuthService } from '../services/AdminAuthService';
import { StatusCodes } from 'http-status-codes';
import { AdminRequest } from '../middlewares/admin.middleware';

const adminAuthService = new AdminAuthService();

export class AdminAuthController {
    static async login(req: AdminRequest, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Email and password are required'
                });
            }

            const result = await adminAuthService.login({ email, password });

            res.status(StatusCodes.OK).json({
                message: 'Login successful',
                ...result
            });
        } catch (error: any) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: error.message });
        }
    }

    static async refreshToken(req: AdminRequest, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Refresh token is required'
                });
            }

            const { accessToken } = await adminAuthService.refreshAccessToken(refreshToken);

            res.status(StatusCodes.OK).json({ accessToken });
        } catch (error: any) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: error.message });
        }
    }

    static async changePassword(req: AdminRequest, res: Response) {
        try {
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Old password and new password are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'New password must be at least 6 characters'
                });
            }

            await adminAuthService.changePassword(req.admin!.id, oldPassword, newPassword);

            res.status(StatusCodes.OK).json({ message: 'Password changed successfully' });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async logout(req: AdminRequest, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                await adminAuthService.logout(refreshToken);
            }

            res.status(StatusCodes.OK).json({ message: 'Logged out successfully' });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async me(req: AdminRequest, res: Response) {
        try {
            res.status(StatusCodes.OK).json({ admin: req.admin });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
