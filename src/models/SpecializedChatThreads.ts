import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ChatThread } from "./ChatThread";
import { User } from "./User";

@Entity("weekly_planning_threads")
export class WeeklyPlanningThread {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ChatThread)
    @JoinColumn({ name: "thread_id" })
    thread!: ChatThread;

    @Column({ name: "week_number", type: "smallint" })
    weekNumber!: number;

    @Column({ name: "date_range", length: 50 })
    dateRange!: string;

    @Column({ name: "weekly_plan_id", type: "bigint", nullable: true })
    weeklyPlanId?: string;
}

@Entity("milestones")
export class Milestone {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ length: 300 })
    name!: string;

    @Column({ length: 50, nullable: true })
    status?: string;

    @Column({ type: "smallint", default: 0 })
    progress!: number;

    @Column({ type: "timestamp with time zone", nullable: true })
    deadline?: Date;

    @Column({ name: "evidence_submitted", default: false })
    evidenceSubmitted!: boolean;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}

@Entity("milestone_threads")
export class MilestoneThread {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ChatThread)
    @JoinColumn({ name: "thread_id" })
    thread!: ChatThread;

    @Column({ name: "milestone_id" })
    milestoneId!: string;

    @ManyToOne(() => Milestone)
    @JoinColumn({ name: "milestone_id" })
    milestone!: Milestone;
}

@Entity("projects")
export class Project {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ length: 300 })
    name!: string;

    @Column({ length: 50, nullable: true })
    status?: string;

    @Column({ name: "steps_remaining", type: "smallint", default: 0 })
    stepsRemaining!: number;

    @Column({ type: "decimal", precision: 8, scale: 2, name: "estimated_hours", nullable: true })
    estimatedHours?: number;

    @Column({ name: "last_action", length: 500, nullable: true })
    lastAction?: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}

@Entity("project_threads")
export class ProjectThread {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ChatThread)
    @JoinColumn({ name: "thread_id" })
    thread!: ChatThread;

    @Column({ name: "project_id" })
    projectId!: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project!: Project;
}

@Entity("thread_badges")
export class ThreadBadge {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ChatThread, (thread) => thread.badges)
    @JoinColumn({ name: "thread_id" })
    thread!: ChatThread;

    @Column({ length: 50 })
    type!: string;

    @Column({ length: 100 })
    label!: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
