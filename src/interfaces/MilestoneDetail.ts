import { MilestoneStep } from "@/models/MilestoneStep";

export interface MilestoneDetail {
    id: number;
    title: string;
    category: string;
    priority: string;
    estimatedTime: string;
    description: string;
    verificationMethod: string;
    deadline?: Date;
    evidenceSubmitted: boolean;
    progress: number;
    status: string;
    createdAt: Date;
    evidence?: string;
    steps: MilestoneStepDetail[];
}

export interface MilestoneStepDetail {
    id: number;
    title: string;
    description: string;
    stepNumber: number;
    completed: boolean;
    createdAt: Date;
}