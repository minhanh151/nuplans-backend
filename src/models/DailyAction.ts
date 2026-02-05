import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { WeeklyPlan } from "./WeeklyPlan";

@Entity("daily_actions")
export class DailyAction {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "weekly_plan_id", type: "bigint", nullable: true })
    weeklyPlanId?: number;

    @ManyToOne(() => WeeklyPlan)
    @JoinColumn({ name: "weekly_plan_id" })
    weeklyPlan?: WeeklyPlan;

    @Column({ length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ length: 50, nullable: true })
    priority?: string;

    @Column({ length: 100, nullable: true })
    category?: string;

    @Column({ name: "estimated_time", length: 50, nullable: true })
    estimatedTime?: string;

    @Column({ name: "action_date", type: "date" })
    actionDate!: Date;

    @Column({ default: false })
    completed!: boolean;

    @Column({ type: "smallint", default: 0 })
    status!: number; // 0: in-progress, 1: submitted

    @Column({ name: "evidence_path", type: "text", nullable: true })
    evidencePath?: string;

    @Column({ name: "approved_at", type: "timestamp with time zone", nullable: true })
    approvedAt?: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
