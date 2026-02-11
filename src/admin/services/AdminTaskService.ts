import AppDataSource from '../../data-source';
import { AdminUserAssignment } from '@/admin/models/AdminUserAssignment';
import { Milestone } from '@/models/Milestone';
import { DailyAction } from '@/models/DailyAction';
import { MilestoneStep } from '@/models/MilestoneStep';
import { Profile } from '@/models/Profile';
import { In } from 'typeorm';
import { MilestoneStatus } from '@/interfaces/milestone/MilestoneStatus';
import { DailyActionStatus } from '@/interfaces/dailyAction/DailyActionStatus';
import { UserSubmission } from '@/admin/models/UserSubmission';

export interface TaskFilters {
    status?: string;
    userId?: string;
    type?: 'milestone' | 'daily_action';
    page?: number;
    limit?: number;
}

export class AdminTaskService {
    private assignmentRepository = AppDataSource.getRepository(AdminUserAssignment);
    private milestoneRepository = AppDataSource.getRepository(Milestone);
    private dailyActionRepository = AppDataSource.getRepository(DailyAction);
    private milestoneStepRepository = AppDataSource.getRepository(MilestoneStep);
    private profileRepository = AppDataSource.getRepository(Profile);
    private userSubmissionRepository = AppDataSource.getRepository(UserSubmission);

    /**
     * Get user IDs that are assigned to the admin
     */
    private async getAssignedUserIds(adminId: string): Promise<string[]> {
        const assignments = await this.assignmentRepository.find({
            where: { adminId }
        });
        return assignments.map(a => a.userId);
    }

    /**
     * Get milestones pending review for admin's assigned users
     * Status 'under-review' means submitted and waiting for admin approval
     */
    async getPendingMilestones(adminId: string, filters: TaskFilters = {}) {
        const userIds = await this.getAssignedUserIds(adminId);

        if (userIds.length === 0) {
            return { items: [], total: 0 };
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.milestoneRepository
            .createQueryBuilder('milestone')
            .leftJoinAndSelect('milestone.user', 'user')
            .where('milestone.userId IN (:...userIds)', { userIds })
            .andWhere('milestone.status = :status', { status: filters.status || 'under-review' });

        if (filters.userId) {
            queryBuilder.andWhere('milestone.userId = :userId', { userId: filters.userId });
        }

        const [items, total] = await queryBuilder
            .orderBy('milestone.updatedAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        // Get profiles
        const profileUserIds = items.map(m => m.userId);
        const profiles = await this.profileRepository.find({
            where: { userId: In(profileUserIds) }
        });
        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        const itemsWithProfile = items.map(milestone => ({
            ...milestone,
            userProfile: profileMap.get(milestone.userId) || null
        }));

        return { items: itemsWithProfile, total, page, limit };
    }

    /**
     * Get daily actions pending review for admin's assigned users
     * Status 1 means submitted
     */
    async getPendingDailyActions(adminId: string, filters: TaskFilters = {}) {
        const userIds = await this.getAssignedUserIds(adminId);

        if (userIds.length === 0) {
            return { items: [], total: 0 };
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.dailyActionRepository
            .createQueryBuilder('dailyAction')
            .leftJoinAndSelect('dailyAction.user', 'user')
            .where('dailyAction.userId IN (:...userIds)', { userIds })
            .andWhere('dailyAction.status = :status', { status: 1 }); // 1 = submitted

        if (filters.userId) {
            queryBuilder.andWhere('dailyAction.userId = :userId', { userId: filters.userId });
        }

        const [items, total] = await queryBuilder
            .orderBy('dailyAction.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        // Get profiles
        const profileUserIds = items.map(da => da.userId);
        const profiles = await this.profileRepository.find({
            where: { userId: In(profileUserIds) }
        });
        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        const itemsWithProfile = items.map(action => ({
            ...action,
            userProfile: profileMap.get(action.userId) || null
        }));

        return { items: itemsWithProfile, total, page, limit };
    }

    /**
     * Get milestone detail with steps
     */
    async getMilestoneDetail(milestoneId: number, adminId: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const milestone = await this.milestoneRepository.findOne({
            where: { id: milestoneId },
            relations: ['user', 'project']
        });

        if (!milestone) {
            throw new Error('Milestone not found');
        }

        if (!userIds.includes(milestone.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        // Get steps
        const steps = await this.milestoneStepRepository.find({
            where: { milestoneId },
            order: { createdAt: 'ASC' }
        });

        // Get profile
        const profile = await this.profileRepository.findOne({
            where: { userId: milestone.userId }
        });

        return {
            ...milestone,
            steps,
            userProfile: profile
        };
    }

    /**
     * Get daily action detail
     */
    async getDailyActionDetail(actionId: number, adminId: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const action = await this.dailyActionRepository.findOne({
            where: { id: actionId },
            relations: ['user', 'weeklyPlan']
        });

        if (!action) {
            throw new Error('Daily action not found');
        }

        if (!userIds.includes(action.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        // Get profile
        const profile = await this.profileRepository.findOne({
            where: { userId: action.userId }
        });

        return {
            ...action,
            userProfile: profile
        };
    }

    /**
     * Approve a milestone
     */
    async approveMilestone(milestoneId: number, adminId: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const milestone = await this.milestoneRepository.findOne({
            where: { id: milestoneId }
        });

        if (!milestone) {
            throw new Error('Milestone not found');
        }

        if (!userIds.includes(milestone.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        if (milestone.status !== 'under-review') {
            throw new Error('Milestone is not pending review');
        }

        milestone.status = 'completed';
        await this.milestoneRepository.save(milestone);

        return milestone;
    }

    /**
     * Reject a milestone
     */
    async rejectMilestone(milestoneId: number, adminId: string, reason?: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const milestone = await this.milestoneRepository.findOne({
            where: { id: milestoneId }
        });

        if (!milestone) {
            throw new Error('Milestone not found');
        }

        if (!userIds.includes(milestone.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        if (milestone.status !== 'under-review') {
            throw new Error('Milestone is not pending review');
        }

        milestone.status = 'pending';
        milestone.evidenceSubmitted = false;
        milestone.evidence = undefined;
        await this.milestoneRepository.save(milestone);

        return milestone;
    }

    /**
     * Approve a daily action
     */
    async approveDailyAction(actionId: number, adminId: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const action = await this.dailyActionRepository.findOne({
            where: { id: actionId }
        });

        if (!action) {
            throw new Error('Daily action not found');
        }

        if (!userIds.includes(action.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        if (action.status !== 1) {
            throw new Error('Daily action is not pending review');
        }

        action.status = 2; // 2 = approved
        action.completed = true;
        action.approvedAt = new Date();
        await this.dailyActionRepository.save(action);

        return action;
    }

    /**
     * Reject a daily action
     */
    async rejectDailyAction(actionId: number, adminId: string, reason?: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        const action = await this.dailyActionRepository.findOne({
            where: { id: actionId }
        });

        if (!action) {
            throw new Error('Daily action not found');
        }

        if (!userIds.includes(action.userId)) {
            throw new Error('Access denied. User is not assigned to you.');
        }

        if (action.status !== 1) {
            throw new Error('Daily action is not pending review');
        }

        action.status = 0; // Reset to in-progress
        action.evidencePath = undefined;
        action.completed = false;
        await this.dailyActionRepository.save(action);

        return action;
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(adminId: string) {
        const userIds = await this.getAssignedUserIds(adminId);

        if (userIds.length === 0) {
            return {
                pendingTasks: 0,
                completedTasks: 0,
                totalUsers: 0,
                completionRate: 0,
                todaySubmissions: 0,
            };
        }

        const [
            pendingMilestones,
            pendingDailyActions,
            completedMilestones,
            completedDailyActions,
            todaySubmissions
        ] = await Promise.all([
            this.milestoneRepository
                .createQueryBuilder('milestone')
                .where('milestone.userId IN (:...userIds)', { userIds })
                .andWhere('milestone.status = :status', { status: MilestoneStatus.UNDER_REVIEW })
                .getCount(),
            this.dailyActionRepository
                .createQueryBuilder('dailyAction')
                .where('dailyAction.userId IN (:...userIds)', { userIds })
                .andWhere('dailyAction.status = :status', { status: DailyActionStatus.SUBMITTED })
                .getCount(),
            this.milestoneRepository
                .createQueryBuilder('milestone')
                .where('milestone.userId IN (:...userIds)', { userIds })
                .andWhere('milestone.status = :status', { status: MilestoneStatus.COMPLETED })
                .getCount(),
            this.dailyActionRepository
                .createQueryBuilder('dailyAction')
                .where('dailyAction.userId IN (:...userIds)', { userIds })
                .andWhere('dailyAction.status = :status', { status: DailyActionStatus.APPROVED })
                .getCount(),
            this.userSubmissionRepository
                .createQueryBuilder('userSubmission')
                .where('userSubmission.userId IN (:...userIds)', { userIds })
                .andWhere('userSubmission.submittedAt >= :today', { today: new Date().toISOString().split('T')[0] })
                .getCount()
        ]);

        const totalTasks = pendingMilestones + pendingDailyActions + completedMilestones + completedDailyActions;

        return {
            pendingTasks: pendingMilestones + pendingDailyActions,
            completedTasks: completedMilestones + completedDailyActions,
            totalUsers: userIds.length,
            completionRate: (completedMilestones + completedDailyActions) / (totalTasks || 1) * 100,
            todaySubmissions: todaySubmissions,
        }
    }
}
