import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AppDataSource from '../data-source';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { EmailService } from './email.service';
import config from '../config/config';

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);
    private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    private emailService = new EmailService();

    async register(data: Partial<User>) {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password!, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = this.userRepository.create({
            ...data,
            password: hashedPassword,
            verificationToken,
            isVerified: false,
        });

        await this.userRepository.save(newUser);
        await this.emailService.sendVerificationEmail(newUser.email, verificationToken);

        return newUser;
    }

    async verifyEmail(token: string) {
        const user = await this.userRepository.findOne({ where: { verificationToken: token } });
        if (!user) {
            throw new Error('Invalid token');
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await this.userRepository.save(user);

        return user;
    }

    async login(data: Pick<User, 'email' | 'password'>) {
        const user = await this.userRepository.findOne({ where: { email: data.email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.isVerified) {
            throw new Error('Email not verified');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const { accessToken, refreshToken } = await this.generateTokens(user);

        return { user, accessToken, refreshToken };
    }

    private async generateTokens(user: User) {
        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            config.JWT.SECRET,
            { expiresIn: config.JWT.EXPIRES_IN as any }
        );

        const refreshTokenValue = jwt.sign(
            { id: user.id },
            config.JWT.REFRESH_SECRET,
            { expiresIn: config.JWT.REFRESH_EXPIRES_IN as any }
        );

        // Save refresh token to database
        const expiresAt = new Date();
        // Default to 7 days if not easily parseable for now, or we can improve this
        // For simplicity in this step, let's assume REFRESH_EXPIRES_IN is 7d
        expiresAt.setDate(expiresAt.getDate() + 7);

        const refreshToken = this.refreshTokenRepository.create({
            token: refreshTokenValue,
            userId: user.id,
            expiresAt,
        });

        await this.refreshTokenRepository.save(refreshToken);

        return { accessToken, refreshToken: refreshTokenValue };
    }

    async refreshAccessToken(token: string) {
        try {
            const payload = jwt.verify(token, config.JWT.REFRESH_SECRET) as { id: string };
            const storedToken = await this.refreshTokenRepository.findOne({
                where: { token, userId: payload.id },
                relations: ['user']
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new Error('Invalid or expired refresh token');
            }

            const user = storedToken.user;
            const accessToken = jwt.sign(
                { id: user.id, email: user.email },
                config.JWT.SECRET,
                { expiresIn: config.JWT.EXPIRES_IN as any }
            );

            return { accessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await this.userRepository.save(user);
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userRepository.createQueryBuilder('user')
            .where('user.resetPasswordToken = :token', { token })
            .andWhere('user.resetPasswordExpires > :now', { now: new Date() })
            .getOne();

        if (!user) {
            throw new Error('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await this.userRepository.save(user);
    }

    async logout(token: string) {
        await this.refreshTokenRepository.delete({ token });
    }
}
