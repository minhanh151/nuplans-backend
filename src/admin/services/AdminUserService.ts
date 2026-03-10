import AppDataSource from '../../data-source';
import { AdminUserAssignment } from '../models/AdminUserAssignment';
import { User } from '../../models/User';
import { Profile } from '../../models/Profile';
import { Milestone } from '../../models/Milestone';
import { DailyAction } from '../../models/DailyAction';
import { UserAtRisk, RiskStatus, RiskLevel } from '../models/UserAtRisk';
import { UserSubmission } from '../models/UserSubmission';
import { In } from 'typeorm';

export class AdminUserService {
    private assignmentRepository = AppDataSource.getRepository(AdminUserAssignment);
    private userRepository = AppDataSource.getRepository(User);
    private profileRepository = AppDataSource.getRepository(Profile);
    private milestoneRepository = AppDataSource.getRepository(Milestone);
    private dailyActionRepository = AppDataSource.getRepository(DailyAction);
    private userAtRiskRepository = AppDataSource.getRepository(UserAtRisk);
    private userSubmissionRepository = AppDataSource.getRepository(UserSubmission);

    /**
     * Build enriched user data matching ManagedUser interface for a set of user IDs
     */
    private async enrichUsersWithStats(userIds: string[]) {
        if (userIds.length === 0) {
            return {
                profileMap: new Map<string, Profile>(),
                pendingTasksMap: new Map<string, number>(),
                completedTasksMap: new Map<string, number>(),
                lastActivityMap: new Map<string, Date>(),
                riskLevelMap: new Map<string, string>(),
                progressMap: new Map<string, number>(),
            };
        }

        // 1. Profiles
        const profiles = await this.profileRepository
            .createQueryBuilder('profile')
            .where('profile.userId IN (:...userIds)', { userIds })
            .getMany();
        const profileMap = new Map(profiles.map(p => [p.userId, p]));

        // 2. Pending milestone tasks (status = 'under-review')
        const pendingMilestones = await this.milestoneRepository
            .createQueryBuilder('m')
            .select('m.user_id', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('m.user_id IN (:...userIds)', { userIds })
            .andWhere("m.status = :status", { status: 'under-review' })
            .groupBy('m.user_id')
            .getRawMany();

        // 3. Pending daily action tasks (status = 1, i.e. submitted awaiting approval)
        const pendingDailyActions = await this.dailyActionRepository
            .createQueryBuilder('da')
            .select('da.user_id', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('da.user_id IN (:...userIds)', { userIds })
            .andWhere('da.status = :status', { status: 1 })
            .andWhere('da.approved_at IS NULL')
            .groupBy('da.user_id')
            .getRawMany();

        // 4. Completed milestone tasks (status = 'completed')
        const completedMilestones = await this.milestoneRepository
            .createQueryBuilder('m')
            .select('m.user_id', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('m.user_id IN (:...userIds)', { userIds })
            .andWhere("m.status = :status", { status: 'completed' })
            .groupBy('m.user_id')
            .getRawMany();

        // 5. Completed daily action tasks (completed = true AND approved_at IS NOT NULL)
        const completedDailyActions = await this.dailyActionRepository
            .createQueryBuilder('da')
            .select('da.user_id', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('da.user_id IN (:...userIds)', { userIds })
            .andWhere('da.completed = true')
            .andWhere('da.approved_at IS NOT NULL')
            .groupBy('da.user_id')
            .getRawMany();

        // 6. Last activity from user_submissions
        const lastSubmissionActivity = await this.userSubmissionRepository
            .createQueryBuilder('us')
            .select('us.user_id', 'userId')
            .addSelect('MAX(us.submitted_at)', 'lastActivity')
            .where('us.user_id IN (:...userIds)', { userIds })
            .groupBy('us.user_id')
            .getRawMany();

        // 8. Risk levels (active risks, take highest)
        const activeRisks = await this.userAtRiskRepository.find({
            where: {
                userId: In(userIds),
                status: RiskStatus.ACTIVE,
            }
        });

        // 9. Average milestone progress per user
        const milestoneProgress = await this.milestoneRepository
            .createQueryBuilder('m')
            .select('m.user_id', 'userId')
            .addSelect('AVG(m.progress)', 'avgProgress')
            .where('m.user_id IN (:...userIds)', { userIds })
            .groupBy('m.user_id')
            .getRawMany();

        // Build maps
        const pendingTasksMap = new Map<string, number>();
        for (const row of pendingMilestones) {
            pendingTasksMap.set(row.userId, parseInt(row.count, 10));
        }
        for (const row of pendingDailyActions) {
            const current = pendingTasksMap.get(row.userId) || 0;
            pendingTasksMap.set(row.userId, current + parseInt(row.count, 10));
        }

        const completedTasksMap = new Map<string, number>();
        for (const row of completedMilestones) {
            completedTasksMap.set(row.userId, parseInt(row.count, 10));
        }
        for (const row of completedDailyActions) {
            const current = completedTasksMap.get(row.userId) || 0;
            completedTasksMap.set(row.userId, current + parseInt(row.count, 10));
        }

        const lastActivityMap = new Map<string, Date>();
        for (const row of lastSubmissionActivity) {
            if (row.lastActivity) {
                lastActivityMap.set(row.userId, new Date(row.lastActivity));
            }
        }

        // Risk level priority: high > medium > low
        const riskPriority: Record<string, number> = {
            [RiskLevel.HIGH]: 3,
            [RiskLevel.MEDIUM]: 2,
            [RiskLevel.LOW]: 1,
        };
        const riskLevelMap = new Map<string, string>();
        for (const risk of activeRisks) {
            const existing = riskLevelMap.get(risk.userId);
            if (!existing || (riskPriority[risk.riskLevel] || 0) > (riskPriority[existing] || 0)) {
                riskLevelMap.set(risk.userId, risk.riskLevel);
            }
        }

        const progressMap = new Map<string, number>();
        for (const row of milestoneProgress) {
            if (row.avgProgress !== null && row.avgProgress !== undefined) {
                progressMap.set(row.userId, Math.round(parseFloat(row.avgProgress)));
            }
        }

        return {
            profileMap,
            pendingTasksMap,
            completedTasksMap,
            lastActivityMap,
            riskLevelMap,
            progressMap,
        };
    }

    private static readonly BATCH_SIZE = 30;

    /**
     * Enrich users in batches of BATCH_SIZE to avoid query parameter limits,
     * then merge all batch results into a single enrichment object.
     */
    private async enrichUsersInBatches(userIds: string[]) {
        type Enrichment = Awaited<ReturnType<typeof this.enrichUsersWithStats>>;

        const mergedEnrichment: Enrichment = {
            profileMap: new Map<string, Profile>(),
            pendingTasksMap: new Map<string, number>(),
            completedTasksMap: new Map<string, number>(),
            lastActivityMap: new Map<string, Date>(),
            riskLevelMap: new Map<string, string>(),
            progressMap: new Map<string, number>(),
        };

        for (let i = 0; i < userIds.length; i += AdminUserService.BATCH_SIZE) {
            const batch = userIds.slice(i, i + AdminUserService.BATCH_SIZE);
            const batchResult = await this.enrichUsersWithStats(batch);

            // Merge each map from the batch into the merged result
            for (const [k, v] of batchResult.profileMap) mergedEnrichment.profileMap.set(k, v);
            for (const [k, v] of batchResult.pendingTasksMap) mergedEnrichment.pendingTasksMap.set(k, v);
            for (const [k, v] of batchResult.completedTasksMap) mergedEnrichment.completedTasksMap.set(k, v);
            for (const [k, v] of batchResult.lastActivityMap) mergedEnrichment.lastActivityMap.set(k, v);
            for (const [k, v] of batchResult.riskLevelMap) mergedEnrichment.riskLevelMap.set(k, v);
            for (const [k, v] of batchResult.progressMap) mergedEnrichment.progressMap.set(k, v);
        }

        return mergedEnrichment;
    }

    /**
     * Map a user to the ManagedUser response shape
     */
    private mapToManagedUser(
        user: User,
        enrichment: Awaited<ReturnType<typeof this.enrichUsersWithStats>>
    ) {
        const profile = enrichment.profileMap.get(user.id);
        return {
            id: user.id,
            email: user.email,
            fullName: profile?.fullName || user.name || '',
            avatarUrl: profile?.selfiePath || undefined,
            phone: profile?.phone || undefined,
            createdAt: user.createdAt,
            pendingTasks: enrichment.pendingTasksMap.get(user.id) || 0,
            completedTasks: enrichment.completedTasksMap.get(user.id) || 0,
            lastActivity: enrichment.lastActivityMap.get(user.id) || undefined,
            riskLevel: enrichment.riskLevelMap.get(user.id) || undefined,
            progress: enrichment.progressMap.get(user.id) || undefined,
        };
    }

    /**
     * Get all users assigned to an admin
     */
    async getAssignedUsers(adminId: string) {
        const assignments = await this.assignmentRepository.find({
            where: { adminId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        const userIds = assignments.map(a => a.userId);

        if (userIds.length === 0) {
            return [];
        }

        const enrichment = await this.enrichUsersInBatches(userIds);

        return assignments.map(assignment =>
            this.mapToManagedUser(assignment.user, enrichment)
        );
    }

    /**
     * Get all users (for master admin to assign)
     */
    async getAllUsers() {
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' }
        });

        const userIds = users.map(u => u.id);
        const enrichment = await this.enrichUsersInBatches(userIds);

        // Get assignments to know which users are already assigned
        const assignments = await this.assignmentRepository.find();
        const assignmentMap = new Map<string, string[]>();

        for (const assignment of assignments) {
            const existing = assignmentMap.get(assignment.userId) || [];
            existing.push(assignment.adminId);
            assignmentMap.set(assignment.userId, existing);
        }

        return users.map(user => ({
            ...this.mapToManagedUser(user, enrichment),
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
