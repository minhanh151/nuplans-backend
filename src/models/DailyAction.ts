import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";
import { WeeklyPlan } from "./WeeklyPlan";

@Entity("daily_actions")
export class DailyAction {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "profile_id", type: "uuid" })
    profileId!: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ name: "weekly_plan_id", type: "bigint", nullable: true })
    weeklyPlanId?: string;

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

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
