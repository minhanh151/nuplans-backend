import AppDataSource from '../../data-source';
import { AdminUserAssignment } from '../models/AdminUserAssignment';
import { User } from '../../models/User';
import { Profile } from '../../models/Profile';

export class AdminUserService {
    private assignmentRepository = AppDataSource.getRepository(AdminUserAssignment);
    private userRepository = AppDataSource.getRepository(User);
    private profileRepository = AppDataSource.getRepository(Profile);

    /**
     * Get all users assigned to an admin
     */
    async getAssignedUsers(adminId: string) {
        const assignments = await this.assignmentRepository.find({
            where: { adminId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        // Get profiles for users
        const userIds = assignments.map(a => a.userId);

        if (userIds.length === 0) {
            return [];
        }

        const profiles = await this.profileRepository
            .createQueryBuilder('profile')
            .where('profile.userId IN (:...userIds)', { userIds })
            .getMany();

        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        return assignments.map(assignment => ({
            id: assignment.user.id,
            email: assignment.user.email,
            name: assignment.user.name,
            isVerified: assignment.user.isVerified,
            assignedAt: assignment.createdAt,
            profile: profileMap.get(assignment.userId) || null
        }));
    }

    /**
     * Get all users (for master admin to assign)
     */
    async getAllUsers() {
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' }
        });

        // Get profiles
        const profiles = await this.profileRepository.find();
        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        // Get assignments to know which users are already assigned
        const assignments = await this.assignmentRepository.find();
        const assignmentMap = new Map<string, string[]>();

        for (const assignment of assignments) {
            const existing = assignmentMap.get(assignment.userId) || [];
            existing.push(assignment.adminId);
            assignmentMap.set(assignment.userId, existing);
        }

        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            profile: profileMap.get(user.id) || null,
            assignedAdminIds: assignmentMap.get(user.id) || []
        }));
    }

    /**
     * Assign a user to an admin
     */
    async assignUserToAdmin(adminId: string, userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        const existingAssignment = await this.assignmentRepository.findOne({
            where: { adminId, userId }
        });

        if (existingAssignment) {
            throw new Error('User is already assigned to this admin');
        }

        const assignment = this.assignmentRepository.create({
            adminId,
            userId
        });

        await this.assignmentRepository.save(assignment);

        return assignment;
    }

    /**
     * Unassign a user from an admin
     */
    async unassignUserFromAdmin(adminId: string, userId: string) {
        const assignment = await this.assignmentRepository.findOne({
            where: { adminId, userId }
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        await this.assignmentRepository.delete(assignment.id);
    }
}
