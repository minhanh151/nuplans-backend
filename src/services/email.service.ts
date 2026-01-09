import nodemailer from 'nodemailer';
import config from '../config/config';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.EMAIL.HOST,
            port: config.EMAIL.PORT,
            secure: config.EMAIL.PORT === 465, // true for 465, false for other ports
            auth: {
                user: config.EMAIL.USER,
                pass: config.EMAIL.PASS,
            },
        });
    }

    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationUrl = `${config.APP_URL}/api/auth/verify-email?token=${token}`;

        await this.transporter.sendMail({
            from: config.EMAIL.FROM,
            to: email,
            subject: 'Verify your email address',
            html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you didn't create an account, you can ignore this email.</p>
      `,
        });
    }

    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        const resetUrl = `${config.APP_URL}/password-reset?token=${token}`; // Frontend URL

        await this.transporter.sendMail({
            from: config.EMAIL.FROM,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>The link will expire in 1 hour.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
        });
    }
}
