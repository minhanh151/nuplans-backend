import logger from "@/utils/logger";
import AppDataSource from "../data-source";
import { UserContext } from "../interfaces/UserContext";
import { ChatThread } from "../models/ChatThread";
import { DailyAction } from "../models/DailyAction";
import { Milestone } from "../models/Milestone";
import { Profile } from "../models/Profile";
import { SkillProfile } from "../models/SkillProfile";
import { User } from "../models/User";

export class UserContextBuilder {
    private profileRepo = AppDataSource.getRepository(Profile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private chatThreadRepo = AppDataSource.getRepository(ChatThread);
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);
    private skillProfileRepo = AppDataSource.getRepository(SkillProfile);
    private static instance: UserContextBuilder;

    public static getInstance(): UserContextBuilder {
        if (!UserContextBuilder.instance) {
            UserContextBuilder.instance = new UserContextBuilder();
        }
        return UserContextBuilder.instance;
    }

    public async build(user: User): Promise<UserContext> {
        // Calculate months
        const now = new Date();
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            logger.error(`Profile not found for user ${user.id}`);
            return {
                careerPath: '',
                currentMonth: 0,
                totalMonths: 0,
                milestonesCompleted: 0,
                totalMilestones: 0,
                skillsProficiency: 0,
                daysActive: 0,
                lastActivityDays: 0,
                hasAppliedToJobs: false,
                upcomingDeadlines: [],
                strugglingWith: undefined
            };
        }
        const created = user.createdAt || new Date();
        const onboardingCompleted = profile.onboardingCompletedAt || created;

        const currentMonth = Math.ceil((now.getTime() - onboardingCompleted.getTime()) / (1000 / 60 / 60 / 24 / 30)) || 1;
        const totalMonths = profile.onboardingTimelineMonths || 6;

        // Milestones
        const totalMilestones = await this.milestoneRepo.count({ where: { userId: user.id } });
        const milestonesCompleted = await this.milestoneRepo.count({ where: { userId: user.id, status: 'approved' } });

        // Activity
        const daysActive = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        const skillProfile = await this.skillProfileRepo.findOne({ where: { profileId: profile.id } });
        let lastActivityDays = 0;
        const lastThread = await this.chatThreadRepo.findOne({
            where: { userId: user.id },
            order: { lastMessageDate: 'DESC' }
        });

        if (lastThread && lastThread.lastMessageDate) {
            lastActivityDays = Math.floor((now.getTime() - lastThread.lastMessageDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
            // If no chat threads, maybe check updated at of user or profile
            lastActivityDays = Math.floor((now.getTime() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Applied Jobs (simplistic check for now)
        const hasApplied = await this.dailyActionRepo.count({
            where: { profileId: profile.id, category: 'Job Application', completed: true }
        });

        return {
            careerPath: profile.careerPath || skillProfile?.careerPath || '',
            currentMonth: currentMonth > 0 ? currentMonth : 1,
            totalMonths: totalMonths,
            milestonesCompleted,
            totalMilestones,
            skillsProficiency: skillProfile?.overallProgress || 0,
            daysActive,
            lastActivityDays,
            hasAppliedToJobs: hasApplied > 0,
            upcomingDeadlines: [], // Ignored per request
            strugglingWith: undefined // Ignored per request
        };
    }
}