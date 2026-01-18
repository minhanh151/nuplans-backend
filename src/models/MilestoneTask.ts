import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Milestone } from "./Milestone";
import { Profile } from "./Profile";

@Entity("milestone_tasks")
export class MilestoneTask {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "profile_id", type: "uuid" })
    profileId!: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ name: "milestone_id", type: "bigint", nullable: true })
    milestoneId?: string;

    @ManyToOne(() => Milestone)
    @JoinColumn({ name: "milestone_id" })
    milestone?: Milestone;

    @Column({ length: 255 })
    label!: string;

    @Column({ name: "deadline", type: "timestamp with time zone" })
    deadline!: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
