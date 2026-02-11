import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../models/User";
import { Admin } from "./Admin";

export enum SubmissionType {
    MILESTONE = 'milestone',
    DAILY_ACTION = 'daily_action'
}

export enum SubmissionStatus {
    SUBMITTED = 'submitted',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

@Entity("user_submissions")
export class UserSubmission {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "submission_type", type: "varchar", length: 20 })
    submissionType!: SubmissionType;

    @Column({ name: "reference_id", type: "bigint" })
    referenceId!: number;

    @Column({ name: "evidence_path", type: "text", nullable: true })
    evidencePath?: string;

    @Column({ type: "varchar", length: 20, default: SubmissionStatus.SUBMITTED })
    status!: SubmissionStatus;

    @Column({ name: "reviewed_by", type: "uuid", nullable: true })
    reviewedBy?: string;

    @ManyToOne(() => Admin)
    @JoinColumn({ name: "reviewed_by" })
    reviewer?: Admin;

    @Column({ name: "reviewed_at", type: "timestamp with time zone", nullable: true })
    reviewedAt?: Date;

    @Column({ name: "review_note", type: "text", nullable: true })
    reviewNote?: string;

    @Column({ name: "submitted_at", type: "timestamp with time zone", default: () => "now()" })
    submittedAt!: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}
