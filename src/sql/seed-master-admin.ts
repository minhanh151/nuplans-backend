import 'reflect-metadata';
import bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { Admin, AdminRole } from '../admin/models/Admin';

/**
 * Seed the initial master admin account
 * Run with: npx ts-node -r tsconfig-paths/register src/sql/seed-master-admin.ts
 */
async function seedMasterAdmin() {
    const email = process.env.MASTER_ADMIN_EMAIL || 'admin@nuplans.com';
    const password = process.env.MASTER_ADMIN_PASSWORD || 'Admin@123456';
    const name = process.env.MASTER_ADMIN_NAME || 'Master Admin';

    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database connected.');

        const adminRepository = AppDataSource.getRepository(Admin);

        // Check if master admin already exists
        const existingAdmin = await adminRepository.findOne({
            where: { email }
        });

        if (existingAdmin) {
            console.log(`Master admin with email ${email} already exists.`);
            console.log('Admin ID:', existingAdmin.id);
            await AppDataSource.destroy();
            return;
        }

        // Create master admin
        const hashedPassword = await bcrypt.hash(password, 10);

        const masterAdmin = adminRepository.create({
            email,
            password: hashedPassword,
            name,
            role: AdminRole.MASTER_ADMIN,
            isActive: true,
        });

        await adminRepository.save(masterAdmin);

        console.log('Master admin created successfully!');
        console.log('==================================');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Admin ID:', masterAdmin.id);
        console.log('==================================');
        console.log('IMPORTANT: Please change this password after first login!');

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error seeding master admin:', error);
        process.exit(1);
    }
}

seedMasterAdmin();
