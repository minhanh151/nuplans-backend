import AppDataSource from "@/data-source";
import { UserAtRisk, RiskStatus, RiskLevel } from "@/admin/models/UserAtRisk";
import { Milestone } from "@/models/Milestone";
import { UserSubmission, SubmissionStatus } from "@/admin/models/UserSubmission";
import { AdminUserAssignment } from "@/admin/models/AdminUserAssignment";
import { AdminRole } from "@/admin/models/Admin";
import logger from "@/utils/logger";
import { In } from "typeorm";
import { Profile } from "@/models/Profile";

interface RiskCandidate {
    userId: string;
    reasons: string[];
    riskLevel: RiskLevel;
}

export class UserAtRiskService {
    private static instance: UserAtRiskService;
    private profileRepo = AppDataSource.getRepository(Profile);

    private levelPriority: Record<RiskLevel, number> = {
        [RiskLevel.LOW]: 0,
        [RiskLevel.MEDIUM]: 1,
        [RiskLevel.HIGH]: 2,
    };

    private riskRepo = AppDataSource.getRepository(UserAtRisk);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private submissionRepo = AppDataSource.getRepository(UserSubmission);

    public static getInstance(): UserAtRiskService {
        if (!UserAtRiskService.instance) {
            UserAtRiskService.instance = new UserAtRiskService();
        }
        return UserAtRiskService.instance;
    }

    /**
     * Main entry point – called by the daily cron at 1 AM.
     * 1. Detect overdue milestones
     * 2. Detect evidence rejected > 2 times
     * 3. Sync results into user_at_risks (create new, resolve stale)
     */
    async computeAndSync(): Promise<void> {
        logger.info("[UserAtRiskService] Starting daily risk computation...");

        const [overdueRisks, rejectRisks] = await Promise.all([
            this.findOverdueUsers(),
            this.findHighRejectUsers(),
        ]);

        const allCandidates = [...overdueRisks, ...rejectRisks];
        logger.info(`[UserAtRiskService] Found ${overdueRisks.length} overdue risks, ${rejectRisks.length} reject risks`);

        // Merge candidates by userId: combine reasons, pick highest risk level
        const merged = this.mergeCandidatesByUser(allCandidates);

        await this.syncRisks(merged);

        logger.info("[UserAtRiskService] Risk computation completed.");
    }

    /**
     * Find users with milestones past their deadline that are not completed.
     */
    private async findOverdueUsers(): Promise<RiskCandidate[]> {
        const now = new Date();

        const overdueMilestones: { user_id: string; milestone_name: string; deadline: Date }[] =
            await this.milestoneRepo
                .createQueryBuilder("m")
                .select("m.user_id", "user_id")
                .addSelect("m.name", "milestone_name")
                .addSelect("m.deadline", "deadline")
                .where("m.deadline < :now", { now })
                .andWhere("m.status NOT IN (:...excludedStatuses)", {
                    excludedStatuses: ["completed"],
                })
                .getRawMany();

        const candidates: RiskCandidate[] = [];
        // Group by user
        const userMap = new Map<string, { names: string[]; maxOverdueDays: number }>();

        for (const row of overdueMilestones) {
            const overdueDays = Math.floor(
                (now.getTime() - new Date(row.deadline).getTime()) / (1000 * 60 * 60 * 24)
            );

            const entry = userMap.get(row.user_id) || { names: [], maxOverdueDays: 0 };
            entry.names.push(row.milestone_name);
            entry.maxOverdueDays = Math.max(entry.maxOverdueDays, overdueDays);
            userMap.set(row.user_id, entry);
        }

        for (const [userId, data] of userMap.entries()) {
            let riskLevel: RiskLevel;
            if (data.maxOverdueDays > 7) {
                riskLevel = RiskLevel.HIGH;
            } else if (data.maxOverdueDays > 3) {
                riskLevel = RiskLevel.MEDIUM;
            } else {
                riskLevel = RiskLevel.LOW;
            }

            candidates.push({
                userId,
                reasons: [`Number of milestones overdue: ${data.names.length} (max ${data.maxOverdueDays} days)`],
                riskLevel,
            });
        }

        return candidates;
    }

    /**
     * Find users whose evidence has been rejected more than 2 times
     * for the same (submission_type, reference_id).
     */
    private async findHighRejectUsers(): Promise<RiskCandidate[]> {
        const rows: { user_id: string; submission_type: string; reference_id: string; reject_count: string }[] =
            await this.submissionRepo
                .createQueryBuilder("s")
                .select("s.user_id", "user_id")
                .addSelect("s.submission_type", "submission_type")
                .addSelect("s.reference_id", "reference_id")
                .addSelect("COUNT(*)", "reject_count")
                .where("s.status = :status", { status: SubmissionStatus.REJECTED })
                .groupBy("s.user_id")
                .addGroupBy("s.submission_type")
                .addGroupBy("s.reference_id")
                .having("COUNT(*) > 2")
                .getRawMany();

        // Group by userId
        const userMap = new Map<string, { details: string[]; maxRejectCount: number }>();

        for (const row of rows) {
            const rejectCount = parseInt(row.reject_count, 10);
            const entry = userMap.get(row.user_id) || { details: [], maxRejectCount: 0 };
            entry.details.push(`${row.submission_type} #${row.reference_id} (${rejectCount} rejections)`);
            entry.maxRejectCount = Math.max(entry.maxRejectCount, rejectCount);
            userMap.set(row.user_id, entry);
        }

        const candidates: RiskCandidate[] = [];

        for (const [userId, data] of userMap.entries()) {
            let riskLevel: RiskLevel;
            if (data.maxRejectCount > 5) {
                riskLevel = RiskLevel.HIGH;
            } else if (data.maxRejectCount > 3) {
                riskLevel = RiskLevel.MEDIUM;
            } else {
                riskLevel = RiskLevel.LOW;
            }

            candidates.push({
                userId,
                reasons: [`Evidence rejected ${data.details.length} times`],
                riskLevel,
            });
        }

        return candidates;
    }

    /**
     * Merge multiple RiskCandidates for the same userId into a single entry.
     * Combines reasons arrays and picks the highest risk level.
     */
    private mergeCandidatesByUser(candidates: RiskCandidate[]): RiskCandidate[] {
        const map = new Map<string, RiskCandidate>();

        for (const c of candidates) {
            const existing = map.get(c.userId);
            if (existing) {
                existing.reasons.push(...c.reasons);
                if (this.levelPriority[c.riskLevel] > this.levelPriority[existing.riskLevel]) {
                    existing.riskLevel = c.riskLevel;
                }
            } else {
                map.set(c.userId, { ...c, reasons: [...c.reasons] });
            }
        }

        return Array.from(map.values());
    }

    /**
     * Sync computed risk candidates with the user_at_risks table.
     * Unique key: userId (one active risk record per user).
     * - Create new active risks for users not already tracked
     * - Update existing active risks with new reasons & risk level
     * - Resolve active risks for users no longer at risk
     */
    private async syncRisks(candidates: RiskCandidate[]): Promise<void> {
        for (const c of candidates) {
            const risk = await this.riskRepo.findOneBy({ userId: c.userId, status: RiskStatus.ACTIVE });
            if (risk) {
                logger.info(`[UserAtRiskService] Updating risk for user ${c.userId}`);
                risk.reasons = [...risk.reasons, ...c.reasons];
                if (this.levelPriority[c.riskLevel] > this.levelPriority[risk.riskLevel]) {
                    logger.info(`[UserAtRiskService] Risk level for user ${c.userId} updated from ${risk.riskLevel} to ${c.riskLevel}`);
                    risk.riskLevel = c.riskLevel;
                }
                await this.riskRepo.save(risk);
            } else {
                logger.info(`[UserAtRiskService] Creating new risk for user ${c.userId}`);
                const newRisk = new UserAtRisk();
                newRisk.userId = c.userId;
                newRisk.reasons = c.reasons;
                newRisk.riskLevel = c.riskLevel;
                newRisk.status = RiskStatus.ACTIVE;
                await this.riskRepo.save(newRisk);
            }
        }
    }

    /**
     * Get at-risk users for admin API.
     * Master admin: returns all at-risk users.
     * Regular admin: returns only at-risk users assigned to them.
     */
    async getAtRiskUsers(
        adminId: string,
        adminRole: AdminRole,
        filters: { status?: string; riskLevel?: string; page?: number; limit?: number } = {}
    ) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const qb = this.riskRepo
            .createQueryBuilder("risk")
            .leftJoinAndSelect("risk.user", "user");

        // If not master admin, filter by assigned users only
        if (adminRole !== AdminRole.MASTER_ADMIN) {
            const assignmentRepo = AppDataSource.getRepository(AdminUserAssignment);
            const assignments = await assignmentRepo.find({ where: { adminId } });
            const userIds = assignments.map((a) => a.userId);

            if (userIds.length === 0) {
                return { items: [], total: 0, page, limit };
            }

            qb.andWhere("risk.userId IN (:...userIds)", { userIds });
        }

        // Filter by status
        if (filters.status) {
            qb.andWhere("risk.status = :status", { status: filters.status });
        } else {
            // Default: only active risks
            qb.andWhere("risk.status = :status", { status: RiskStatus.ACTIVE });
        }

        // Filter by risk level
        if (filters.riskLevel) {
            qb.andWhere("risk.riskLevel = :riskLevel", { riskLevel: filters.riskLevel });
        }

        const [items, total] = await qb
            .orderBy("risk.createdAt", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const userIds = items.map((risk) => risk.userId);
        const profiles = await this.profileRepo.createQueryBuilder("profile")
            .select(["profile.userId", "profile.fullName", "user.email"])
            .leftJoinAndSelect("profile.user", "user")
            .where({ userId: In(userIds) }).getMany();

        logger.info(`[UserAtRiskService] Profiles: ${JSON.stringify(profiles)}`);

        const profileMap = new Map<string, Profile>();
        profiles.forEach((profile) => profileMap.set(profile.userId, profile));

        // Map to simplified response shape
        const result = items.map((risk) => ({
            userId: risk.userId,
            userName: profileMap.get(risk.userId)?.fullName || null,
            email: profileMap.get(risk.userId)?.user?.email || null,
            riskLevel: risk.riskLevel,
            riskReasons: risk.reasons,
        }));

        return { items: result, total, page, limit };
    }
}
