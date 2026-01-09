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
            const { user, token } = await authService.login(req.body);
            res.status(StatusCodes.OK).json({ message: 'Login successful', user, token });
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
}
