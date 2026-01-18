import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { StatusCodes } from 'http-status-codes';

const authService = new AuthService();

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body);
            res.status(StatusCodes.CREATED).json({ message: 'User registered successfully. Please check your email to verify.', user });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Token is required' });
            }
            await authService.verifyEmail(token as string);
            res.status(StatusCodes.OK).json({ message: 'Email verified successfully' });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { user, accessToken, refreshToken } = await authService.login(req.body);
            res.status(StatusCodes.OK).json({
                message: 'Login successful',
                user,
                accessToken,
                refreshToken
            });
        } catch (error: any) {
            console.error(error);
            res.status(StatusCodes.UNAUTHORIZED).json({ message: error.message });
        }
    }

    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Refresh token is required' });
            }
            const { accessToken } = await authService.refreshAccessToken(refreshToken);
            res.status(StatusCodes.OK).json({ accessToken });
        } catch (error: any) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: error.message });
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await authService.forgotPassword(email);
            res.status(StatusCodes.OK).json({ message: 'If the email exists, a password reset link has been sent.' });
        } catch (error: any) {
            // Don't leak user existence
            res.status(StatusCodes.OK).json({ message: 'If the email exists, a password reset link has been sent.' });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            await authService.resetPassword(token, newPassword);
            res.status(StatusCodes.OK).json({ message: 'Password reset successfully' });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            res.status(StatusCodes.OK).json({ message: 'Logged out successfully' });
        } catch (error: any) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
        }
    }
}
