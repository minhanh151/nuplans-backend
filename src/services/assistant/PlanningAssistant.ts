import AppDataSource from "@/data-source";
import { UserContext } from "@/interfaces/UserContext";
import { DailyAction } from "@/models/DailyAction";
import { Milestone } from "@/models/Milestone";
import { MilestoneTask } from "@/models/MilestoneTask";
import { Profile } from "@/models/Profile";
import { Project } from "@/models/Project";
import { SkillProfile } from "@/models/SkillProfile";
import { User } from "@/models/User";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { AIProviderType } from "@/services/ai/AIProvider";
import { AIService } from "@/services/ai/AIService";
import { AISystemInstructions } from "@/services/ai/AISystemInstructions";
import { UserContextBuilder } from "@/services/UserContextBuilder";
import { AIResponseUtils } from "@/utils/aiResponseUtils";

export class PlanningAssistant {

    private profileRepo = AppDataSource.getRepository(Profile);
    private skillProfileRepo = AppDataSource.getRepository(SkillProfile);
    private milestoneRepo = AppDataSource.getRepository(Milestone);
    private projectRepo = AppDataSource.getRepository(Project);
    private weeklyPlanRepo = AppDataSource.getRepository(WeeklyPlan);
    private dailyActionRepo = AppDataSource.getRepository(DailyAction);
    private milestoneTaskRepo = AppDataSource.getRepository(MilestoneTask);

    private static PlanningAssistantInstance: PlanningAssistant;

    public static getInstance(): PlanningAssistant {
        if (!PlanningAssistant.PlanningAssistantInstance) {
            PlanningAssistant.PlanningAssistantInstance = new PlanningAssistant();
        }
        return PlanningAssistant.PlanningAssistantInstance;
    }

    public async initMileStonesAndProjects(user: User, profile: Profile) {
        const skillProfile = await this.skillProfileRepo.findOne({ where: { profileId: profile.id } });

        // Build User Context
        const userContext = await UserContextBuilder.getInstance().build(user);

        // 1. Check for Roadmap (Milestones/Projects)
        const existingMilestones = await this.milestoneRepo.find({ where: { userId: user.id } });
        const existingProjects = await this.projectRepo.find({ where: { userId: user.id } });

        let roadmapData = { milestones: existingMilestones, projects: existingProjects };
        const needsRoadmap = !existingMilestones.length;

        if (needsRoadmap) {
            const aiService = AIService.getInstance();
            const aiProvider = aiService.getProvider(AIProviderType.GEMINI);

            const roadmapPrompt = `
                You are an expert Career Coach. Generate a comprehensive career roadmap for the following user:
                PROFILE: ${JSON.stringify(profile)}
                SKILLS: ${JSON.stringify(skillProfile)}

                OUTPUT: A JSON object with "milestones" and "projects".
                - "milestones" array: items with "name", "category", "priority" (mandatory/optional), "estimated_time", "description", "verification_method" (upload/api/auto/review), "deadline" (ISO date string within next 6 months).
                - "projects" array: items with "name", "description", "category", "impact", "priority".
                All strings should be concise.
            `;

            const aiRes = await aiProvider.generateContent({
                systemInstruction: AISystemInstructions.JSON_ONLY,
                content: roadmapPrompt
            });

            const parsedData = AIResponseUtils.responseToJSON(aiRes.content);

            if (parsedData.milestones) {
                const milestonesToSave = parsedData.milestones.map((m: any) => {
                    const milestone = new Milestone();
                    milestone.userId = user.id;
                    milestone.name = m.name;
                    milestone.category = m.category;
                    milestone.priority = m.priority;
                    milestone.estimatedTime = m.estimated_time;
                    milestone.description = m.description;
                    milestone.verificationMethod = m.verification_method;
                    milestone.deadline = m.deadline ? new Date(m.deadline) : undefined;
                    milestone.status = "pending";
                    return milestone;
                });
                roadmapData.milestones = await this.milestoneRepo.save(milestonesToSave);
            }

            if (parsedData.projects) {
                const projectsToSave = parsedData.projects.map((p: any) => {
                    const project = new Project();
                    project.userId = user.id;
                    project.name = p.name;
                    project.category = p.category;
                    project.description = p.description;
                    project.impact = p.impact;
                    project.priority = p.priority;
                    project.status = "planning";
                    return project;
                });
                roadmapData.projects = await this.projectRepo.save(projectsToSave);
            }
        }

        return roadmapData;
    }


    public async generateWeeklyPlan(user: User, userContext: UserContext, weekNumber: number) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.GEMINI);
        const activeProjects = await this.projectRepo.find({
            where: { userId: user.id, status: "active" },
            take: 3
        });

        const pendingMilestones = await this.milestoneRepo.find({
            where: { userId: user.id, status: "pending" },
            take: 3
        });

        const weeklyPrompt = `
                    You are an expert Career Coach.
                    USER CONTEXT:
                    - Career Path: ${userContext.careerPath}
                    - Current Month: ${userContext.currentMonth}
                    - Milestones Completed: ${userContext.milestonesCompleted} / ${userContext.totalMilestones}
                    - Skills Proficiency: ${userContext.skillsProficiency}%
                    - Days Active: ${userContext.daysActive}
    
                    Based on the user's active projects: ${JSON.stringify(activeProjects)} and pending milestones: ${JSON.stringify(pendingMilestones)}, generate a weekly plan for week ${weekNumber}.
                    OUTPUT: JSON with "summary", "priority_task_title", "priority_task_description", "impact", "estimated_time".
                `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: weeklyPrompt
        });

        const planData = AIResponseUtils.responseToJSON(aiRes.content);

        const weeklyPlan = new WeeklyPlan();
        weeklyPlan.userId = user.id;
        weeklyPlan.weekNumber = weekNumber;
        weeklyPlan.dateRange = `Week ${weekNumber}`;
        weeklyPlan.summary = planData.summary;
        weeklyPlan.priorityTaskTitle = planData.priority_task_title;
        weeklyPlan.priorityTaskDescription = planData.priority_task_description;
        weeklyPlan.impact = planData.impact;
        weeklyPlan.estimatedTime = planData.estimated_time;
        // if (planData.project_id) {
        //     weeklyPlan.projectId = planData.project_id;
        // }

        return weeklyPlan;
    }

    public async generateDailyActions(userContext: UserContext, profile: Profile, weeklyPlan: WeeklyPlan) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.GEMINI);

        const dailyPrompt = `
                    You are an expert Career Coach.
                    USER CONTEXT:
                    - Career Path: ${userContext.careerPath}
                    - Current Month: ${userContext.currentMonth}
                    - Last Activity: ${userContext.lastActivityDays} days ago
                    - Applied to Jobs: ${userContext.hasAppliedToJobs}
    
                    Based on the user's weekly plan: ${JSON.stringify(weeklyPlan)}, generate daily actions for the current day to help achieve the plan.
                    OUTPUT: JSON with "daily_actions" array: { title, description, priority, category, estimated_time }.
                `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: dailyPrompt
        });

        const data = AIResponseUtils.responseToJSON(aiRes.content);
        let dailyActions: DailyAction[] = [];

        if (data.daily_actions) {
            await this.dailyActionRepo.delete({ profileId: profile.id, actionDate: new Date() });

            const actionsToSave = data.daily_actions.map((a: any) => {
                const action = new DailyAction();
                action.profileId = profile.id;
                action.weeklyPlanId = weeklyPlan.id;
                action.title = a.title;
                action.description = a.description;
                action.priority = a.priority;
                action.category = a.category;
                action.estimatedTime = a.estimated_time;
                action.actionDate = new Date();
                return action;
            });
            dailyActions = await this.dailyActionRepo.save(actionsToSave);
        }
        return dailyActions;
    }

    public async generateMilestoneTasks(userContext: UserContext, profile: Profile, milestone: Milestone) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.GEMINI);

        const taskPrompt = `
                    You are an expert Career Coach.
                    USER CONTEXT:
                    - Career Path: ${userContext.careerPath}
    
                    Based on the milestone: ${JSON.stringify(milestone)}, generate specific tasks to complete it.
                    OUTPUT: JSON with "milestone_tasks" array: { label, due_in_days }.
                `;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: AISystemInstructions.JSON_ONLY,
            content: taskPrompt
        });

        const data = AIResponseUtils.responseToJSON(aiRes.content);
        let milestoneTasks: MilestoneTask[] = [];

        if (data.milestone_tasks) {
            // Check if tasks already exist for this milestone to avoid duplication logic if needed, 
            // but for now we follow the pattern of refreshing or appending. 
            // The previous logic deleted ALL milestone tasks for profile, which might be aggressive if splitting by milestone.
            // Let's delete only tasks for this milestone if we are regenerating for it.
            await this.milestoneTaskRepo.delete({ profileId: profile.id, milestoneId: milestone.id });

            const tasksToSave = data.milestone_tasks.map((t: any) => {
                const task = new MilestoneTask();
                task.profileId = profile.id;
                task.milestoneId = milestone.id;
                task.label = t.label;
                task.dueInDays = t.due_in_days;
                return task;
            });
            milestoneTasks = await this.milestoneTaskRepo.save(tasksToSave);
        }
        return milestoneTasks;
    }
}