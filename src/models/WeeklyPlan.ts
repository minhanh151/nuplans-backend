import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Milestone } from "./Milestone";
import { User } from "./User";

@Entity("weekly_plans")
export class WeeklyPlan {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "user_id", nullable: true })
    userId?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user?: User;


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

    @Column({ name: "start_date", type: "timestamp with time zone", nullable: true })
    startDate!: Date;

    @Column({ name: "deadline", type: "timestamp with time zone", nullable: true })
    deadline!: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}
