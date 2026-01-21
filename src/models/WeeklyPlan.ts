import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Milestone } from "./Milestone";
import { User } from "./User";

@Entity("weekly_plans")
export class WeeklyPlan {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id", nullable: true })
    userId?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user?: User;

    @Column({ name: "milestone_id", type: "bigint", nullable: true })
    milestoneId?: string;

    @ManyToOne(() => Milestone)
    @JoinColumn({ name: "milestone_id" })
    milestone?: Milestone;

    @Column({ name: "week_number", type: "smallint" })
    weekNumber!: number;

    @Column({ name: "date_range", length: 50 })
    dateRange!: string;

    @Column({ type: "text", nullable: true })
    summary?: string;

    @Column({ name: "priority_task_title", length: 255, nullable: true })
    priorityTaskTitle?: string;

    @Column({ name: "priority_task_description", type: "text", nullable: true })
    priorityTaskDescription?: string;

    @Column({ type: "text", nullable: true })
    impact?: string;

    @Column({ name: "estimated_time", length: 50, nullable: true })
    estimatedTime?: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}
