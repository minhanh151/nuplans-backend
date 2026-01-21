import { MilestoneStep } from "@/models/MilestoneStep";

export interface MilestoneDetail {
    id: string;
    name: string;
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
    steps: MilestoneStep[];
}