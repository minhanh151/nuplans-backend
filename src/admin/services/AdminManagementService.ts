import bcrypt from 'bcrypt';
import AppDataSource from '../../data-source';
import { Admin, AdminRole } from '../models/Admin';
import { AdminRefreshToken } from '../models/AdminRefreshToken';

export interface CreateAdminDto {
    email: string;
    password: string;
    name?: string;
    role?: AdminRole;
}

export class AdminManagementService {
    private adminRepository = AppDataSource.getRepository(Admin);
    private refreshTokenRepository = AppDataSource.getRepository(AdminRefreshToken);

    async createAdmin(data: CreateAdminDto) {
        const existingAdmin = await this.adminRepository.findOne({ where: { email: data.email } });

        if (existingAdmin) {
            throw new Error('Admin with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newAdmin = this.adminRepository.create({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || AdminRole.ADMIN,
            isActive: true,
        });

        await this.adminRepository.save(newAdmin);

        // Return admin without password
        const { password: _, ...adminWithoutPassword } = newAdmin;
        return adminWithoutPassword;
    }

    async getAdmins() {
        const admins = await this.adminRepository.find({
            order: { createdAt: 'DESC' }
        });

        // Remove passwords from response
        return admins.map(({ password: _, ...admin }) => admin);
    }

    async getAdminById(id: string) {
        const admin = await this.adminRepository.findOne({ where: { id } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
    }

    async lockAdmin(id: string, currentAdminId: string) {
        if (id === currentAdminId) {
            throw new Error('Cannot lock your own account');
        }

        const admin = await this.adminRepository.findOne({ where: { id } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        if (admin.role === AdminRole.MASTER_ADMIN) {
            throw new Error('Cannot lock a master admin account');
        }

        admin.lockedAt = new Date();
        await this.adminRepository.save(admin);

        // Invalidate all refresh tokens
        await this.refreshTokenRepository.delete({ adminId: id });

        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
    }

    async unlockAdmin(id: string) {
        const admin = await this.adminRepository.findOne({ where: { id } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        admin.lockedAt = undefined;
        await this.adminRepository.save(admin);

        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
    }

    async resetAdminPassword(id: string, newPassword: string, currentAdminId: string) {
        const admin = await this.adminRepository.findOne({ where: { id } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        // Only master admin can reset other master admin's password
        if (admin.role === AdminRole.MASTER_ADMIN && id !== currentAdminId) {
            const currentAdmin = await this.adminRepository.findOne({ where: { id: currentAdminId } });
            if (currentAdmin?.role !== AdminRole.MASTER_ADMIN) {
                throw new Error('Only master admin can reset another master admin password');
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await this.adminRepository.save(admin);

        // Invalidate all refresh tokens
        await this.refreshTokenRepository.delete({ adminId: id });

        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
    }

    async deleteAdmin(id: string, currentAdminId: string) {
        if (id === currentAdminId) {
            throw new Error('Cannot delete your own account');
        }

        const admin = await this.adminRepository.findOne({ where: { id } });

        if (!admin) {
            throw new Error('Admin not found');
        }

        if (admin.role === AdminRole.MASTER_ADMIN) {
            throw new Error('Cannot delete a master admin account');
        }

        // Delete refresh tokens first
        await this.refreshTokenRepository.delete({ adminId: id });

        // Delete admin
        await this.adminRepository.delete(id);
    }
}
