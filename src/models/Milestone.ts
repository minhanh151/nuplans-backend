import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Project } from "./Project";

@Entity("milestones")
export class Milestone {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "project_id", type: "bigint", nullable: true })
    projectId?: number;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project?: Project;

    @Column({ length: 255 })
    name!: string;

    @Column({ length: 100, nullable: true })
    category?: string;

    @Column({ length: 50, nullable: true })
    priority?: string;

    @Column({ name: "estimated_time", length: 50, nullable: true })
    estimatedTime?: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ name: "verification_method", length: 50, nullable: true })
    verificationMethod?: string;

    @Column({ name: "start_date", type: "timestamp with time zone" })
    startDate!: Date;

    @Column({ type: "timestamp with time zone" })
    deadline!: Date;

    @Column({ type: "boolean", default: false, name: "evidence_submitted" })
    evidenceSubmitted!: boolean;

    @Column({ name: "progress", type: "integer", default: 0 })
    progress?: number;

    @Column({ length: 50, default: 'pending' })
    status!: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;

    @Column({ type: "text", nullable: true })
    evidence?: string;
}
