import { Entity, Column, OneToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { Profile } from "./Profile";

@Entity("skill_profiles")
export class SkillProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "profile_id" })
    profileId!: string;

    @OneToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ name: "career_path" })
    careerPath!: string;

    @Column({ name: "overall_progress", default: 0 })
    overallProgress!: number;

    @Column({ name: "gap_closed", default: 0 })
    gapClosed!: number;

    @CreateDateColumn({ type: "timestamp with time zone", name: "last_assessment_date" })
    lastAssessmentDate!: Date;

    @Column({ type: "jsonb", name: "strength_areas", default: [] })
    strengthAreas!: string[];

    @Column({ type: "jsonb", name: "improvement_areas", default: [] })
    improvementAreas!: string[];

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => SkillProfileSkill, (skill) => skill.skillProfile)
    skills!: SkillProfileSkill[];
}

@Entity("skill_profiles_skills")
export class SkillProfileSkill {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "skill_profile_id" })
    skillProfileId!: number;

    @ManyToOne(() => SkillProfile, (profile) => profile.skills)
    @JoinColumn({ name: "skill_profile_id" })
    skillProfile!: SkillProfile;

    @Column({ name: "skill_id" })
    skillId!: string;

    @Column()
    name!: string;

    @Column()
    category!: string;

    @Column({ name: "current_level", default: 0 })
    currentLevel!: number;

    @Column({ name: "target_level", default: 0 })
    targetLevel!: number;

    @Column({ name: "required_for_role", default: false })
    requiredForRole!: boolean;

    @Column({ type: "jsonb", name: "related_courses", default: [] })
    relatedCourses!: string[];

    @CreateDateColumn({ type: "timestamp with time zone", name: "last_updated" })
    lastUpdated!: Date;
}
