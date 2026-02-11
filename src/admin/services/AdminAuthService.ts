import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppDataSource from '../../data-source';
import { Admin, AdminRole } from '../models/Admin';
import { AdminRefreshToken } from '../models/AdminRefreshToken';
import config from '../../config/config';

export class AdminAuthService {
    private adminRepository = AppDataSource.getRepository(Admin);
    private refreshTokenRepository = AppDataSource.getRepository(AdminRefreshToken);

    async login(data: { email: string; password: string }) {
        const admin = await this.adminRepository.findOne({ where: { email: data.email } });

        if (!admin) {
            throw new Error('Invalid credentials');
        }

        if (!admin.isActive) {
            throw new Error('Account is deactivated');
        }

        if (admin.lockedAt) {
            throw new Error('Account is locked');
        }

        const isPasswordValid = await bcrypt.compare(data.password, admin.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login time
        admin.lastLoginAt = new Date();
        await this.adminRepository.save(admin);

        const { accessToken, refreshToken } = await this.generateTokens(admin);

        // Return admin without password
        const { password: _, ...adminWithoutPassword } = admin;

        return { user: adminWithoutPassword, accessToken, refreshToken };
    }

    private async generateTokens(admin: Admin) {
        const accessToken = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role,
                isAdmin: true
            },
            config.JWT.SECRET,
            { expiresIn: config.JWT.EXPIRES_IN as any }
        );

        const refreshTokenValue = jwt.sign(
            { id: admin.id, isAdmin: true },
            config.JWT.REFRESH_SECRET,
            { expiresIn: config.JWT.REFRESH_EXPIRES_IN as any }
        );

        // Save refresh token to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const refreshToken = this.refreshTokenRepository.create({
            token: refreshTokenValue,
            adminId: admin.id,
            expiresAt,
        });

        await this.refreshTokenRepository.save(refreshToken);

        return { accessToken, refreshToken: refreshTokenValue };
    }

    async refreshAccessToken(token: string) {
        try {
            const payload = jwt.verify(token, config.JWT.REFRESH_SECRET) as { id: string; isAdmin: boolean };

            if (!payload.isAdmin) {
                throw new Error('Invalid admin refresh token');
            }

            const storedToken = await this.refreshTokenRepository.findOne({
                where: { token, adminId: payload.id },
                relations: ['admin']
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new Error('Invalid or expired refresh token');
            }

            const admin = storedToken.admin;

            if (!admin.isActive || admin.lockedAt) {
                throw new Error('Account is not accessible');
            }

            const accessToken = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    role: admin.role,
                    isAdmin: true
                },
                config.JWT.SECRET,
                { expiresIn: config.JWT.EXPIRES_IN as any }
            );

            return { accessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async changePassword(adminId: string, oldPassword: string, newPassword: string) {
        const admin = await this.adminRepository.findOne({ where: { id: adminId } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await this.adminRepository.save(admin);

        // Invalidate all refresh tokens
        await this.refreshTokenRepository.delete({ adminId: admin.id });
    }

    async logout(token: string) {
        await this.refreshTokenRepository.delete({ token });
    }
}
