import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Profile } from "./Profile";

@Entity("credit_assessments")
export class CreditAssessment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "profile_id" })
    profileId!: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ name: "credit_score", nullable: true })
    creditScore?: number;

    @Column({ type: "decimal", precision: 12, scale: 2, name: "max_loan_amount", nullable: true })
    maxLoanAmount?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, name: "interest_rate", nullable: true })
    interestRate?: number;

    @Column({ type: "jsonb", name: "assessment_details", nullable: true })
    assessmentDetails?: any;

    @Column({ default: "pending" })
    status!: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
