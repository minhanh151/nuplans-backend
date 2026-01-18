import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

@Entity("profiles")
export class Profile extends BaseEntity {
    @Column({ name: "user_id" })
    userId!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "career_path", nullable: true })
    careerPath?: string;

    @Column({ name: "full_name", nullable: true })
    fullName?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    address?: string;

    @Column({ type: "date", name: "date_of_birth", nullable: true })
    dateOfBirth?: Date;

    @Column({ name: "employment_status", nullable: true })
    employmentStatus?: string;

    @Column({ name: "employer_name", nullable: true })
    employerName?: string;

    @Column({ name: "job_title", nullable: true })
    jobTitle?: string;

    @Column({ type: "decimal", precision: 12, scale: 2, name: "annual_income", nullable: true })
    annualIncome?: number;

    @Column({ name: "employment_duration_months", nullable: true })
    employmentDurationMonths?: number;

    @Column({ name: "cv_file_path", nullable: true })
    cvFilePath?: string;

    @Column({ type: "decimal", precision: 12, scale: 2, name: "monthly_expenses", nullable: true })
    monthlyExpenses?: number;

    @Column({ type: "decimal", precision: 12, scale: 2, name: "existing_debts", nullable: true })
    existingDebts?: number;

    @Column({ name: "housing_status", nullable: true })
    housingStatus?: string;

    @Column({ type: "decimal", precision: 12, scale: 2, name: "monthly_rent_mortgage", nullable: true })
    monthlyRentMortgage?: number;

    @Column({ default: 0 })
    dependents!: number;

    @Column({ type: "jsonb", name: "employment_history", default: [] })
    employmentHistory!: any[];

    @Column({ type: "decimal", precision: 5, scale: 2, name: "total_years_experience", nullable: true })
    totalYearsExperience?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, name: "average_job_duration_months", nullable: true })
    averageJobDurationMonths?: number;

    @Column({ name: "longest_employment_gap_months", nullable: true })
    longestEmploymentGapMonths?: number;

    @Column({ name: "number_of_employers", default: 0 })
    numberOfEmployers!: number;

    @Column({ type: "jsonb", default: [] })
    skills!: any[];

    @Column({ type: "jsonb", default: [] })
    education!: any[];

    @Column({ type: "jsonb", default: [] })
    certifications!: any[];

    @Column({ type: "jsonb", default: [] })
    languages!: any[];

    @Column({ name: "onboarding_timeline_months", nullable: true })
    onboardingTimelineMonths?: number;

    @Column({ name: "trial_opt_in", default: false })
    trialOptIn!: boolean;

    @Column({ type: "jsonb", name: "skills_profile", nullable: true })
    skillsProfile?: any;

    @Column({ type: "timestamp with time zone", name: "onboarding_completed_at", nullable: true })
    onboardingCompletedAt?: Date;

    @Column({ name: "photo_id_path", nullable: true })
    photoIdPath?: string;

    @Column({ name: "selfie_path", nullable: true })
    selfiePath?: string;

    @Column({ name: "idv_status", default: "pending" })
    idvStatus!: string;

    @Column({ type: "timestamp with time zone", name: "idv_submitted_at", nullable: true })
    idvSubmittedAt?: Date;

}
