import AppDataSource from "../data-source";
import { ChatThread } from "../models/ChatThread";
import { ChatMessage } from "../models/ChatMessage";
import { MessageAction } from "../models/MessageAction";
import { AIService } from "./ai/AIService";
import { AIProviderType } from "./ai/AIProvider";
import { User } from "../models/User";
import { UserContext } from "../interfaces/UserContext";
import { Constant } from "@/constants/Constant";
import { In, Not } from "typeorm";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { Milestone } from "@/models/Milestone";
import { Project } from "@/models/Project";
import { AISystemInstructions } from "@/services/ai/AISystemInstructions";
import logger from "@/utils/logger";
import { UserContextBuilder } from "./UserContextBuilder";


export class ChatService {
    private threadRepo = AppDataSource.getRepository(ChatThread);
    private messageRepo = AppDataSource.getRepository(ChatMessage);
    private actionRepo = AppDataSource.getRepository(MessageAction);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private projectRepo = AppDataSource.getRepository(Project);

    public async getThreads(user: User) {
        const listThreads = await this.threadRepo.find({
            where: { userId: user.id },
            relations: ["group", "badges"],
            order: { lastMessageDate: "DESC" }
        });

        const groups: any[] = [];
        const groupedThreads: Record<number, any[]> = {};

        let listArchivedThreads: any[] = [];

        for (const thread of listThreads) {
            const gid = thread.groupId || 0;
            if (!groupedThreads[gid]) groupedThreads[gid] = [];
            groupedThreads[gid].push(thread);
        }
        let threadDetails: any[] = [];

        for (const [gid, threads] of Object.entries(groupedThreads)) {
            const listGroupObjectId = threads.map(t => t.groupObjectId);
            if (Constant.GROUP_TYPE.WEEKLY_PLAN === parseInt(gid)) {
                const listWeeklyPlan = await this.weeklyPlanRepo.find({ where: { id: In(listGroupObjectId) } });
                threadDetails = threads.map(t => {
                    const weeklyPlan = listWeeklyPlan.find(w => +w.id === +t.groupObjectId);
                    return {
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        messageCount: t.messageCount,
                        lastMessageDate: t.lastMessageDate,
                        badges: t.badges,
                        weekNumber: weeklyPlan?.weekNumber,
                        dateRange: weeklyPlan?.dateRange
                    };
                });
            } else if (Constant.GROUP_TYPE.MILESTONE === parseInt(gid)) {
                const listMilestone = await this.milestoneRepo.find({ where: { id: In(listGroupObjectId) } });
                threadDetails = threads.map(t => {
                    const milestone = listMilestone.find(m => +m.id === +t.groupObjectId);
                    return {
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        messageCount: t.messageCount,
                        lastMessageDate: t.lastMessageDate,
                        badges: t.badges,
                        milestoneId: milestone?.id,
                        milestoneName: milestone?.name,
                        milestoneStatus: milestone?.status,
                        progress: milestone?.progress,
                        deadline: milestone?.deadline,
                        evidenceSubmitted: milestone?.evidenceSubmitted,
                    };
                });
            } else if (Constant.GROUP_TYPE.PROJECT === parseInt(gid)) {
                const listProject = await this.projectRepo.find({ where: { id: In(listGroupObjectId) } });
                threadDetails = threads.map(t => {
                    const project = listProject.find(p => +p.id === +t.groupObjectId);
                    return {
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        messageCount: t.messageCount,
                        lastMessageDate: t.lastMessageDate,
                        badges: t.badges,
                        projectId: project?.id,
                        projectName: project?.name,
                        projectStatus: project?.status,
                        description: project?.description,
                        estimatedHours: project?.estimatedHours,
                        stepsRemaining: project?.stepsRemaining,
                    };
                });
            }
            const archivedThreads = threadDetails.filter(t => t.status === "archived");
            threadDetails = threadDetails.filter(t => t.status !== "archived");
            listArchivedThreads = [...listArchivedThreads, ...archivedThreads];
            groups.push({
                id: gid,
                label: threads[0].group?.label || "General",
                threads: threadDetails
            });
        }
        groups.push({
            id: '0',
            label: "Archived",
            threads: listArchivedThreads
        });

        return groups;
    }

    public async sendMessage(user: User, threadId: string, content: string) {
        const thread = await this.threadRepo.findOne({ where: { id: threadId, userId: user.id } });
        if (!thread) {
            throw new Error("Thread not found");
        }

        const userContext = UserContextBuilder.getInstance().build(user);
        let threadContext;

        if (thread.groupId === Constant.GROUP_TYPE.MILESTONE) {
            const milestone = await this.milestoneRepo.findOne({ where: { id: thread.groupObjectId } });
            threadContext = {
                milestoneName: milestone?.name,
                milestoneStatus: milestone?.status,
                progress: milestone?.progress,
                deadline: milestone?.deadline,
                evidenceSubmitted: milestone?.evidenceSubmitted,
            }
        } else if (thread.groupId === Constant.GROUP_TYPE.PROJECT) {
            const project = await this.projectRepo.findOne({ where: { id: thread.groupObjectId } });
            threadContext = {
                projectName: project?.name,
                projectStatus: project?.status,
                description: project?.description,
                estimatedHours: project?.estimatedHours,
                stepsRemaining: project?.stepsRemaining,
            }
        } else if (thread.groupId === Constant.GROUP_TYPE.WEEKLY_PLAN) {
            const weeklyPlan = await this.weeklyPlanRepo.findOne({ where: { id: thread.groupObjectId } });
            threadContext = {
                weekNumber: weeklyPlan?.weekNumber,
                dateRange: weeklyPlan?.dateRange,
                startDate: weeklyPlan?.startDate,
                deadline: weeklyPlan?.deadline,
                summary: weeklyPlan?.summary,
            }
        }


        const userMsg = new ChatMessage();
        userMsg.threadId = threadId;
        userMsg.role = "user";
        userMsg.content = content;
        await this.messageRepo.save(userMsg);

        thread.lastMessageDate = new Date();
        thread.messageCount += 1;
        await this.threadRepo.save(thread);

        const history = await this.messageRepo.find({
            where: { threadId: threadId },
            order: { createdAt: "DESC" },
            take: 10
        });

        const historyText = history.reverse().map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.PLANNING_OPENAI);

        const userContextText = userContext ? `User context: ${JSON.stringify(userContext)}` : "";

        const messageContent = `${userContextText}\nHistory: ${historyText}\nUser: ${content}\nThread context: ${JSON.stringify(threadContext)}`;
        logger.info(messageContent);

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.AI_COACHING_CHAT,
            content: messageContent
        });

        let extractedData;
        try {
            let cleanedText = aiRes.content.trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];
            extractedData = JSON.parse(cleanedText);
        } catch (e) {
            extractedData = { response: aiRes.content, actions: [] };
        }

        const assistantMsg = new ChatMessage();
        assistantMsg.threadId = threadId;
        assistantMsg.role = "assistant";
        assistantMsg.content = extractedData.response;
        await this.messageRepo.save(assistantMsg);

        thread.lastMessageDate = new Date();
        thread.messageCount += 1;
        await this.threadRepo.save(thread);

        if (extractedData.actions && Array.isArray(extractedData.actions)) {
            for (const action of extractedData.actions) {
                const msgAction = new MessageAction();
                msgAction.messageId = assistantMsg.id;
                msgAction.actionType = action.type;
                msgAction.label = action.label;
                msgAction.actionData = action.data || {};
                await this.actionRepo.save(msgAction);
            }
        }

        return {
            user_message: userMsg,
            assistant_message: assistantMsg,
            actions: extractedData.actions
        };
    }

    public async getChatHistory(user: User, threadId: string, limit: number = 20, page: number = 1) {
        const thread = await this.threadRepo.findOne({ where: { id: threadId, userId: user.id } });
        if (!thread) {
            throw new Error("Thread not found");
        }

        const [messages, total] = await this.messageRepo.findAndCount({
            where: { threadId: threadId },
            relations: ["actions"],
            order: { createdAt: "DESC" },
            take: limit,
            skip: (page - 1) * limit
        });

        const formattedMessages = messages.reverse().map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
            actions: m.actions?.map(a => ({
                type: a.actionType,
                label: a.label,
                data: a.actionData
            })) || []
        }));

        return {
            messages: formattedMessages,
            total,
            page,
            limit
        };
    }

    public async archiveThread(user: User, threadId: string) {
        const thread = await this.threadRepo.findOne({ where: { id: threadId, userId: user.id } });
        if (!thread) {
            throw new Error("Thread not found");
        }

        thread.status = "archived";
        await this.threadRepo.save(thread);
    }

    public async unarchiveThread(user: User, threadId: string) {
        const thread = await this.threadRepo.findOne({ where: { id: threadId, userId: user.id } });
        if (!thread) {
            throw new Error("Thread not found");
        }

        thread.status = "active";
        await this.threadRepo.save(thread);
    }
}
