export interface UserContext {
    careerPath: string;
    currentMonth: number;
    totalMonths: number;
    milestonesCompleted: number;
    totalMilestones: number;
    skillsProficiency: number;
    daysActive: number;
    lastActivityDays: number;
    hasAppliedToJobs: boolean;
    upcomingDeadlines: string[]; // Bỏ qua trường này
    strugglingWith?: string; // Bỏ qua trường này 
}