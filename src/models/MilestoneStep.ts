import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Milestone } from "./Milestone";
import { User } from "./User";

@Entity("milestone_steps")
export class MilestoneStep {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "milestone_id", type: "bigint", nullable: true })
    milestoneId?: string;

    @ManyToOne(() => Milestone)
    @JoinColumn({ name: "milestone_id" })
    milestone?: Milestone;

    @Column({ length: 300 })
    label!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "smallint", name: "step_number" })
    stepNumber!: number;

    @Column({ type: "boolean", name: "is_completed" })
    isCompleted!: boolean;

    @Column({ name: "deadline", type: "timestamp with time zone" })
    deadline!: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
