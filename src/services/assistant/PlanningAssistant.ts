import AppDataSource from "@/data-source";
import { UserContext } from "@/interfaces/UserContext";
import { DailyAction } from "@/models/DailyAction";
import { Milestone } from "@/models/Milestone";
import { MilestoneStep } from "@/models/MilestoneStep";
import { Profile } from "@/models/Profile";
import { Project } from "@/models/Project";
import { SkillProfile } from "@/models/SkillProfile";
import { User } from "@/models/User";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { AIProviderType } from "@/services/ai/AIProvider";
import { AIService } from "@/services/ai/AIService";
import { AISystemInstructions } from "@/services/ai/AISystemInstructions";
import { AIResponseUtils } from "@/utils/aiResponseUtils";
import { truncateString } from "@/utils/stringUtils";
import { GenerateMilestoneService } from "../GenerateMilestoneService";
import { ChatThreadHandler } from "../handlers/ChatThreadHandler";
import { LessThan, MoreThan, Not } from "typeorm";
import { GenerateMilestoneStepService } from "../GenerateMilestoneStepService";
import { GenerateDailyActionService } from "../GenerateDailyActionService";
import logger from "@/utils/logger";
import { DailyActionCategory } from "@/interfaces/DailyActionCategory";

export class PlanningAssistant {

    private profileRepo = AppDataSource.getRepository(Profile);
    private skillProfileRepo = AppDataSource.getRepository(SkillProfile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private projectRepo = AppDataSource.getRepository(Project);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);
    private milestoneStepRepo = AppDataSource.getRepository(MilestoneStep);

    private static PlanningAssistantInstance: PlanningAssistant;

    public static getInstance(): PlanningAssistant {
        if (!PlanningAssistant.PlanningAssistantInstance) {
            PlanningAssistant.PlanningAssistantInstance = new PlanningAssistant();
        }
        return PlanningAssistant.PlanningAssistantInstance;
    }

    public async generateProjects(user: User, profile: Profile) {
        const skillProfile = await this.skillProfileRepo.findOne({ where: { profileId: profile.id } });

        // 1. Check for Roadmap (Milestones/Projects)
        const existingProjects = await this.projectRepo.find({ where: { userId: user.id } });

        const needsRoadmap = !existingProjects.length;
        let roadmapData = { projects: existingProjects, isExisted: !needsRoadmap };

        if (needsRoadmap) {
            const aiService = AIService.getInstance();
            const aiProvider = aiService.getProvider(AIProviderType.PLANNING_OPENAI);

            // Step 1: Generate Projects first
            const projectPrompt = `
                You are an expert Career Coach. Generate a comprehensive career roadmap for the following user.
                PROFILE: ${JSON.stringify(profile)}
                SKILLS: ${JSON.stringify(skillProfile)}

                OUTPUT: A JSON object with "projects" array.
                - "projects" array: items with "name", "description", "category", "impact", "priority" (high/medium/low), estimated_hours.
                Generate 2-4 strategic projects that align with the user's career goals.
                All strings should be concise.
            `;

            const projectRes = await aiProvider.generateContent({
                systemInstruction: AISystemInstructions.JSON_ONLY,
                content: projectPrompt
            });

            const projectData = AIResponseUtils.responseToJSON(projectRes.content);

            if (projectData.projects) {
                const projectsToSave = projectData.projects.map((p: any) => {
                    const project = new Project();
                    project.userId = user.id;
                    project.name = truncateString(p.name, 255);
                    project.category = truncateString(p.category, 50);
                    project.description = p.description;
                    project.impact = truncateString(p.impact, 50);
                    project.priority = truncateString(p.priority, 20);
                    project.estimatedHours = p.estimated_hours;
                    project.status = "planning";
                    return project;
                });
                for (const project of projectsToSave) {
                    await this.projectRepo.save(project);
                    await ChatThreadHandler.getInstance().createProjectThread(user, project);
                    await GenerateMilestoneService.getInstance().createEvent({
                        userId: user.id,
                        projectId: project.id,
                    });
                }
            }
        }

        return roadmapData;
    }

    public async generateMilestones(user: User, profile: Profile, project: Project): Promise<Milestone[]> {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.OPENAI);
        const listMilestone = [];

        const milestonePrompt = `
            You are an expert Career Coach. Generate specific milestones for the following project:
            PROJECT: ${JSON.stringify(project)}
            USER PROFILE: ${JSON.stringify(profile)}

            OUTPUT: A JSON object with "milestones" array.
            - "milestones" array: items with "name", "category", "priority" (mandatory/optional), "estimated_time", "description", "start_date" (ISO date string, when to start), "deadline" (ISO date string within next 6 months).
            Generate 2-3 milestones that will help complete this project.
            All strings should be concise.
        `;

        const milestoneRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: milestonePrompt
        });

        const milestoneData = AIResponseUtils.responseToJSON(milestoneRes.content);

        if (milestoneData.milestones) {
            const milestonesToSave = milestoneData.milestones.map((m: any) => {
                const milestone = new Milestone();
                milestone.userId = user.id;
                milestone.projectId = project.id; // Link to parent project
                milestone.name = truncateString(m.name, 255);
                milestone.category = truncateString(m.category, 50);
                milestone.priority = truncateString(m.priority, 20).toLowerCase();
                milestone.estimatedTime = truncateString(m.estimated_time, 50);
                milestone.description = m.description;
                milestone.verificationMethod = m.verification_method;
                milestone.startDate = m.start_date ? new Date(m.start_date) : new Date();
                milestone.deadline = m.deadline ? new Date(m.deadline) : new Date(new Date().getDate() + 14);
                milestone.status = "pending";
                return milestone;
            });
            const savedMilestones = await this.milestoneRepo.save(milestonesToSave);
            for (const milestone of savedMilestones) {
                await ChatThreadHandler.getInstance().createMilestoneThread(user, milestone);
                await GenerateMilestoneStepService.getInstance().createEvent({
                    userId: user.id,
                    milestoneId: milestone.id,
                });
            }
            listMilestone.push(...savedMilestones);
        }
        return listMilestone;
    }

    public async generateWeeklyPlan(user: User, userContext: UserContext, weekNumber: number) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.OPENAI);


        const focusedMilestones = await this.milestoneRepo.find({
            where: {
                userId: user.id, status: "not-started",
                startDate: LessThan(new Date()),
                deadline: MoreThan(new Date())
            },
        });

        const weeklyPrompt = `
            You are an expert Career Coach.
            USER CONTEXT:
            - Career Path: ${userContext.careerPath}
            - Current Month: ${userContext.currentMonth}
            - Milestones Completed: ${userContext.milestonesCompleted} / ${userContext.totalMilestones}
            - Skills Proficiency: ${userContext.skillsProficiency}%
            - Days Active: ${userContext.daysActive}

            Based on the user's focus on milestones: ${focusedMilestones}, generate a weekly plan for next week (week ${weekNumber}).
            OUTPUT: JSON with "summary", "priority_task_title", "priority_task_description", "impact", "estimated_time", "start_date" (ISO date string for week start), "deadline" (ISO date string for week end).
        `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: weeklyPrompt
        });

        const planData = AIResponseUtils.responseToJSON(aiRes.content);
        const today = new Date();

        const weeklyPlan = new WeeklyPlan();
        weeklyPlan.userId = user.id;
        weeklyPlan.weekNumber = weekNumber;
        weeklyPlan.dateRange = truncateString(`Week ${weekNumber}`, 50);
        weeklyPlan.summary = planData.summary;
        weeklyPlan.priorityTaskTitle = truncateString(planData.priority_task_title, 255);
        weeklyPlan.priorityTaskDescription = planData.priority_task_description;
        weeklyPlan.impact = planData.impact;
        weeklyPlan.estimatedTime = truncateString(planData.estimated_time, 50);
        weeklyPlan.startDate = planData.start_date ? new Date(planData.start_date) : today;
        weeklyPlan.deadline = planData.deadline ? new Date(planData.deadline) : new Date(today.getDate() + 7);

        const savedWeeklyPlan = await this.weeklyPlanRepo.save(weeklyPlan);
        await ChatThreadHandler.getInstance().createWeeklyPlanThread(user, weeklyPlan);
        await GenerateDailyActionService.getInstance().createEvent({
            userId: user.id,
            weeklyPlanId: savedWeeklyPlan.id,
        });

        return weeklyPlan;
    }

    public async generateDailyActions(userContext: UserContext, profile: Profile, weeklyPlan: WeeklyPlan) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.PLANNING_OPENAI);

        // Get user from weeklyPlan or profile
        const userId = weeklyPlan.userId || profile.userId;

        const listCompletedActions = await this.dailyActionRepo.find({
            where: {
                userId: userId,
                completed: true
            },
            select: {
                title: true,
            },
            take: 10
        });
        const listCompletedActionsStr = listCompletedActions.map((a: any) => a.title).join(", ");
        const validCategories = Object.values(DailyActionCategory).map((c: any) => c.toLowerCase());

        const dailyPrompt = `
            You are an expert Career Coach.
            USER CONTEXT:
            - Career Path: ${userContext.careerPath}
            - Current Month: ${userContext.currentMonth}
            - Last Activity: ${userContext.lastActivityDays} days ago
            - Applied to Jobs: ${userContext.hasAppliedToJobs}
            - List actions completed: ${listCompletedActionsStr}

            Based on the user's weekly plan: ${JSON.stringify(weeklyPlan)}, generate 3 daily actions for the current day to help achieve the plan.
            Valid categories: ${validCategories.join(", ")}
            OUTPUT: JSON with "daily_actions" array: { title, description, priority, category, estimated_time }.
        `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: dailyPrompt
        });

        const data = AIResponseUtils.responseToJSON(aiRes.content);
        let dailyActions: DailyAction[] = [];

        if (data.daily_actions) {
            await this.dailyActionRepo.delete({ userId: userId, actionDate: new Date() });

            const actionsToSave = data.daily_actions.map((a: any) => {
                const action = new DailyAction();
                action.userId = userId;
                action.weeklyPlanId = weeklyPlan.id;
                action.title = truncateString(a.title, 300);
                action.description = a.description;
                action.priority = truncateString(a.priority, 50);
                action.category = truncateString(a.category, 50);
                action.estimatedTime = truncateString(a.estimated_time, 50);
                return action;
            });
            dailyActions = await this.dailyActionRepo.save(actionsToSave);
        }
        return dailyActions;
    }

    public async generateMilestoneSteps(userContext: UserContext, profile: Profile, milestone: Milestone) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.MILESTONE_ACTION_OPENAI);

        // Get user from milestone or profile
        const userId = milestone.userId || profile.userId;

        const taskPrompt = `
            You are an expert Career Coach.
            USER CONTEXT:
            - Career Path: ${userContext.careerPath}

            Based on the milestone: ${JSON.stringify(milestone)}, generate specific tasks step to complete it, number of steps should be less than 7.
            OUTPUT: JSON with "milestone_steps" array and order by step_number: { label, description }.
        `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: taskPrompt
        });

        const data = AIResponseUtils.responseToJSON(aiRes.content);
        let milestoneSteps: MilestoneStep[] = [];

        if (data.milestone_steps) {
            // Check if tasks already exist for this milestone to avoid duplication logic if needed, 
            // but for now we follow the pattern of refreshing or appending. 
            // The previous logic deleted ALL milestone tasks for profile, which might be aggressive if splitting by milestone.
            // Let's delete only tasks for this milestone if we are regenerating for it.
            await this.milestoneStepRepo.delete({ userId: userId, milestoneId: milestone.id });

            let stepNumber = 1;
            const tasksToSave = data.milestone_steps.map((t: any) => {
                const task = new MilestoneStep();
                task.userId = userId;
                task.milestoneId = milestone.id;
                task.label = truncateString(t.label, 255);
                task.description = t.description;
                task.stepNumber = stepNumber;
                stepNumber++;
                return task;
            });
            milestoneSteps = await this.milestoneStepRepo.save(tasksToSave);
        }
        return milestoneSteps;
    }
}