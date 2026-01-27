import { User } from "@/models/User";
import { ChatThread } from "@/models/ChatThread";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { Milestone } from "@/models/Milestone";
import { Project } from "@/models/Project";
import { Constant } from "@/constants/Constant";
import AppDataSource from "@/data-source";

export class ChatThreadHandler {
    private threadRepo = AppDataSource.getRepository(ChatThread);

    private static instance: ChatThreadHandler;

    public static getInstance(): ChatThreadHandler {
        if (!ChatThreadHandler.instance) {
            ChatThreadHandler.instance = new ChatThreadHandler();
        }
        return ChatThreadHandler.instance;
    }

    public async createWeeklyPlanThread(user: User, weeklyPlan: WeeklyPlan) {
        return await this.upsertThread(
            user,
            Constant.GROUP_TYPE.WEEKLY_PLAN,
            weeklyPlan.id,
            `Weekly Plan - Week ${weeklyPlan.weekNumber}`
        );
    }

    public async createMilestoneThread(user: User, milestone: Milestone) {
        return await this.upsertThread(
            user,
            Constant.GROUP_TYPE.MILESTONE,
            milestone.id,
            milestone.name
        );
    }

    public async createProjectThread(user: User, project: Project) {
        return await this.upsertThread(
            user,
            Constant.GROUP_TYPE.PROJECT,
            project.id,
            project.name
        );
    }

    private async upsertThread(user: User, groupId: number, groupObjectId: number, title: string) {
        let thread = await this.threadRepo.findOne({
            where: {
                userId: user.id,
                groupId: groupId,
                groupObjectId: groupObjectId
            }
        });

        if (!thread) {
            thread = new ChatThread();
            thread.userId = user.id;
            thread.groupId = groupId;
            thread.groupObjectId = groupObjectId;
            thread.title = title;
            thread.status = "active";
            thread.lastMessageDate = new Date();
            thread.messageCount = 0;
            thread.badges = [];
            thread = await this.threadRepo.save(thread);
        }

        return thread;
    }
}