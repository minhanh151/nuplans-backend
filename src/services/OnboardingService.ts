import AppDataSource from "../data-source";
import { Profile } from "../models/Profile";
import { SkillProfile, SkillProfileSkill } from "../models/SkillProfile";
import { User } from "../models/User";

export class OnboardingService {
    private profileRepo = AppDataSource.getRepository(Profile);
    private skillProfileRepo = AppDataSource.getRepository(SkillProfile);
    private skillProfileSkillRepo = AppDataSource.getRepository(SkillProfileSkill);

    public async saveCvProfile(user: User, data: any) {
        let profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            profile = new Profile();
            profile.userId = user.id;
        }

        // Map data to profile
        profile.careerPath = data.career_path || profile.careerPath;
        profile.fullName = data.full_name || profile.fullName;
        profile.email = data.email || profile.email;
        profile.phone = data.phone || profile.phone;
        profile.address = data.address || profile.address;
        profile.dateOfBirth = data.date_of_birth ? new Date(data.date_of_birth) : profile.dateOfBirth;
        profile.employmentStatus = data.employment_status || profile.employmentStatus;
        profile.employerName = data.employer_name || profile.employerName;
        profile.jobTitle = data.job_title || profile.jobTitle;
        profile.annualIncome = data.annual_income ? parseFloat(data.annual_income) : profile.annualIncome;
        profile.employmentDurationMonths = data.employment_duration_months ? parseInt(data.employment_duration_months) : profile.employmentDurationMonths;
        profile.cvFilePath = data.cv_file_path || profile.cvFilePath;
        profile.monthlyExpenses = data.monthly_expenses ? parseFloat(data.monthly_expenses) : profile.monthlyExpenses;
        profile.existingDebts = data.existing_debts ? parseFloat(data.existing_debts) : profile.existingDebts;
        profile.housingStatus = data.housing_status || profile.housingStatus;
        profile.monthlyRentMortgage = data.monthly_rent_mortgage ? parseFloat(data.monthly_rent_mortgage) : profile.monthlyRentMortgage;
        profile.dependents = data.dependents ? parseInt(data.dependents) : (profile.dependents || 0);

        profile.employmentHistory = data.employment_history || profile.employmentHistory || [];
        profile.totalYearsExperience = data.total_years_experience || profile.totalYearsExperience;
        profile.numberOfEmployers = data.number_of_employers || profile.numberOfEmployers || 0;
        profile.skills = data.skills || profile.skills || [];
        profile.education = data.education || profile.education || [];
        profile.certifications = data.certifications || profile.certifications || [];

        profile.onboardingTimelineMonths = data.onboarding_timeline_months || profile.onboardingTimelineMonths;
        profile.trialOptIn = data.trial_opt_in !== undefined ? data.trial_opt_in : profile.trialOptIn;
        profile.skillsProfile = data.skills_profile || profile.skillsProfile;

        // Extract metrics if available
        if (data.skills_profile && data.skills_profile.metrics) {
            profile.averageJobDurationMonths = data.skills_profile.metrics.averageJobDurationMonths || profile.averageJobDurationMonths;
            profile.longestEmploymentGapMonths = data.skills_profile.metrics.longestGapMonths || profile.longestEmploymentGapMonths;
        }

        await this.profileRepo.save(profile);

        return profile;
    }

    public async saveOnboarding(user: User, data: any) {
        return AppDataSource.transaction(async (manager) => {
            const profileRepo = manager.getRepository(Profile);
            const skillProfileRepo = manager.getRepository(SkillProfile);
            const skillRepo = manager.getRepository(SkillProfileSkill);

            let profile = await profileRepo.findOne({ where: { userId: user.id } });
            if (!profile) {
                profile = new Profile();
                profile.userId = user.id;
            }

            profile.careerPath = data.career_path;
            profile.onboardingTimelineMonths = data.onboarding_timeline_months;
            profile.trialOptIn = data.trial_opt_in;
            profile.skillsProfile = data.skills_profile;
            profile.onboardingCompletedAt = data.onboarding_completed_at ? new Date(data.onboarding_completed_at) : undefined;

            await profileRepo.save(profile);

            if (data.skills_profile) {
                let skillProfile = await skillProfileRepo.findOne({ where: { profileId: profile.id } });
                if (!skillProfile) {
                    skillProfile = new SkillProfile();
                    skillProfile.profileId = profile.id;
                }

                skillProfile.careerPath = data.skills_profile.careerPath || '';
                skillProfile.overallProgress = data.skills_profile.overallProgress || 0;
                skillProfile.gapClosed = data.skills_profile.gapClosed || 0;
                skillProfile.lastAssessmentDate = data.skills_profile.lastAssessmentDate ? new Date(data.skills_profile.lastAssessmentDate) : new Date();
                skillProfile.strengthAreas = data.skills_profile.strengthAreas || [];
                skillProfile.improvementAreas = data.skills_profile.improvementAreas || [];

                await skillProfileRepo.save(skillProfile);

                if (data.skills_profile.skills && Array.isArray(data.skills_profile.skills)) {
                    for (const skillData of data.skills_profile.skills) {
                        let skill = await skillRepo.findOne({
                            where: { skillProfileId: skillProfile.id, skillId: skillData.id }
                        });
                        if (!skill) {
                            skill = new SkillProfileSkill();
                            skill.skillProfileId = skillProfile.id;
                            skill.skillId = skillData.id;
                        }
                        skill.name = skillData.name;
                        skill.category = skillData.category;
                        skill.currentLevel = skillData.currentLevel;
                        skill.targetLevel = skillData.targetLevel;
                        skill.requiredForRole = skillData.requiredForRole;
                        skill.relatedCourses = skillData.relatedCourses || [];
                        await skillRepo.save(skill);
                    }
                }
            }

            return profile;
        });
    }

    public async getProfile(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) {
            return null;
        }
        const skillProfile = await this.skillProfileRepo.findOne({ where: { profileId: profile.id } });
        if (!skillProfile) {
            return profile;
        }
        const skillProfileSkills = await this.skillProfileSkillRepo.find({ where: { skillProfileId: skillProfile.id } });
        profile.skillsProfile = skillProfile;
        profile.skillsProfile.skills = skillProfileSkills;

        return profile;
    }
}
