import AppDataSource from "../data-source";
import { Profile } from "../models/Profile";
import { CreditAssessment } from "../models/CreditAssessment";
import { AIService } from "./ai/AIService";
import { AIProviderType } from "./ai/AIProvider";
import { User } from "../models/User";

export class CreditService {
    private profileRepo = AppDataSource.getRepository(Profile);
    private assessmentRepo = AppDataSource.getRepository(CreditAssessment);

    public async calculateCredit(user: User, profileData: any) {
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.GEMINI);

        const instruction = this.getInstruction();
        const aiRes = await aiProvider.generateContent({
            systemInstruction: instruction,
            content: `Assess creditworthiness for this profile:\n\n${JSON.stringify(profileData, null, 2)}`
        });

        let creditResult;
        try {
            let cleanedText = aiRes.content.trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];
            creditResult = JSON.parse(cleanedText);
        } catch (e) {
            creditResult = this.fallbackCalculation(profileData);
        }

        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (profile) {
            const assessment = new CreditAssessment();
            assessment.profileId = profile.id;
            assessment.creditScore = creditResult.creditScore;
            assessment.maxLoanAmount = creditResult.maxLoanAmount;
            assessment.interestRate = creditResult.interestRate;
            assessment.assessmentDetails = {
                assessment: creditResult.assessment,
                riskLevel: creditResult.riskLevel
            };
            assessment.status = "completed";
            await this.assessmentRepo.save(assessment);
        }

        return creditResult;
    }

    private getInstruction(): string {
        const instruction = `You are an expert credit assessment AI. Analyze the comprehensive profile data and calculate a credit score (300-850) with detailed lending eligibility.

CRITICAL ASSESSMENT FACTORS (weight appropriately):

1. INCOME & EMPLOYMENT (30% weight):
   - Annual income level (higher = better)
   - Employment duration (longer = more stable)
   - Employment status (full-time > part-time > contract > temporary)
   - Total years of experience (more experience = better)
   - Number of employers (too many = job hopper, too few = limited experience)
   - Average job duration (longer = more stable)
   - Employment gaps (longer gaps = higher risk)
   - Time between jobs (shorter gaps = better)

2. FINANCIAL HEALTH (25% weight):
   - Monthly expenses vs income (debt-to-income ratio)
   - Existing debts (lower = better)
   - Savings/emergency fund (higher = better risk buffer)
   - Monthly rent/mortgage (affordability indicator)

3. CREDIT HISTORY (20% weight):
   - Credit history quality (excellent > good > fair > poor > none)
   - Previous defaults (major negative factor)
   - Bank account status (active > overdraft > none)

4. STABILITY INDICATORS (15% weight):
   - Housing status (own > mortgage > rent > living with family)
   - Age (25-55 optimal, <25 or >65 higher risk)
   - Dependents (more dependents = higher expenses)

5. LOAN PURPOSE (10% weight):
   - Education/career development (positive)
   - Emergency (neutral)
   - Debt consolidation (neutral to positive)
   - Other (neutral)

CALCULATION RULES:
- Base score: 500
- Add points for positive factors (income, savings, good credit history, stable employment)
- Subtract points for negative factors (debts, defaults, poor credit, high expenses)
- Calculate debt-to-income ratio: (monthly_expenses + monthly_rent_mortgage) / (annual_income/12 + other_income)
  - If ratio > 0.5: reduce score significantly
  - If ratio 0.3-0.5: moderate reduction
  - If ratio < 0.3: positive factor

INTEREST RATE GUIDELINES:
- Excellent credit (750+): 8-12% APR
- Good credit (700-749): 12-16% APR
- Fair credit (650-699): 16-22% APR
- Poor credit (600-649): 22-28% APR
- Very poor credit (<600): 28-35% APR

MAX LOAN AMOUNT:
- Typically 20-30% of annual income but less than £20000
- Adjust based on debt-to-income ratio
- Consider savings as buffer
- Cap at reasonable amount based on credit score

Return ONLY a valid JSON object with these exact fields:
{
  "creditScore": number (300-850),
  "maxLoanAmount": number (in GBP, reasonable based on income and score),
  "interestRate": number (percentage, e.g., 15.5),
  "assessment": "string (Detailed 2-3 sentence explanation of the score, mentioning key factors)",
  "riskLevel": "string (low/medium/high)"
}

Important: Return ONLY the JSON object, no additional text or explanation.`;
        return instruction;
    }

    private fallbackCalculation(profileData: any) {
        const income = parseFloat(profileData.annual_income) || 0;
        const monthlyExpenses = parseFloat(profileData.monthly_expenses) || 0;
        const monthlyRent = parseFloat(profileData.monthly_rent_mortgage) || 0;
        const existingDebts = parseFloat(profileData.existing_debts) || 0;
        const employmentMonths = parseInt(profileData.employment_duration_months) || 0;
        const dependents = parseInt(profileData.dependents) || 0;

        // Employment history metrics (may not exist)
        const totalYearsExperience = profileData.total_years_experience ? parseFloat(profileData.total_years_experience) : 0;
        const averageJobDuration = profileData.average_job_duration_months ? parseFloat(profileData.average_job_duration_months) : 0;
        const longestGap = profileData.longest_employment_gap_months ? parseInt(profileData.longest_employment_gap_months) : 0;
        const numberOfEmployers = profileData.number_of_employers ? parseInt(profileData.number_of_employers) : 0;
        const employmentHistory = profileData.employment_history || [];

        // Calculate debt-to-income ratio (handle missing financial fields)
        const monthlyIncome = income / 12;
        const totalMonthlyOutgoings = (monthlyExpenses || 0) + (monthlyRent || 0);
        const debtToIncomeRatio = monthlyIncome > 0 ? totalMonthlyOutgoings / monthlyIncome : 0;

        // Base score
        let score = 500;

        // Income factor
        if (income > 0) {
            score += Math.min(150, Math.floor(income / 2000));
        }

        // Employment stability
        if (employmentMonths >= 24) score += 50;
        else if (employmentMonths >= 12) score += 30;
        else if (employmentMonths >= 6) score += 10;

        // Total years of experience
        if (totalYearsExperience >= 10) score += 30;
        else if (totalYearsExperience >= 5) score += 20;
        else if (totalYearsExperience >= 2) score += 10;

        // Average job duration (stability indicator)
        if (averageJobDuration >= 36) score += 25; // 3+ years average
        else if (averageJobDuration >= 24) score += 15; // 2+ years average
        else if (averageJobDuration >= 12) score += 5; // 1+ year average
        else if (averageJobDuration > 0 && averageJobDuration < 6) score -= 20; // Job hopper

        // Employment gaps (negative factor)
        if (longestGap > 12) score -= 40; // Gap > 1 year
        else if (longestGap > 6) score -= 20; // Gap > 6 months
        else if (longestGap > 3) score -= 10; // Gap > 3 months

        // Number of employers (too many = job hopper, too few = limited experience)
        if (numberOfEmployers >= 1 && numberOfEmployers <= 5) {
            // Optimal range
            if (totalYearsExperience > 0) {
                const yearsPerEmployer = totalYearsExperience / numberOfEmployers;
                if (yearsPerEmployer >= 2) score += 15; // Good stability
            }
        } else if (numberOfEmployers > 8) {
            score -= 30; // Too many employers = job hopper
        }


        // Debt-to-income ratio
        if (debtToIncomeRatio > 0.5) score -= 80;
        else if (debtToIncomeRatio > 0.4) score -= 50;
        else if (debtToIncomeRatio > 0.3) score -= 20;
        else if (debtToIncomeRatio < 0.2) score += 20;

        // Existing debts
        if (existingDebts > income * 0.5) score -= 50;
        else if (existingDebts > income * 0.3) score -= 30;
        else if (existingDebts > 0) score -= 10;

        // Credit history
        const creditHistory = profileData.credit_history?.toLowerCase() || "";
        if (creditHistory === "excellent") score += 40;
        else if (creditHistory === "good") score += 20;
        else if (creditHistory === "fair") score += 0;
        else if (creditHistory === "poor") score -= 40;
        else if (creditHistory === "none") score -= 20;


        // Age factor (if available)
        if (profileData.date_of_birth) {
            try {
                const birthDate = new Date(profileData.date_of_birth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 25 || age > 65) score -= 20;
            } catch (e) {
                // Invalid date, skip age factor
            }
        }

        // Dependents factor (if available)
        if (dependents > 0) {
            // More dependents = higher expenses = slightly negative factor
            if (dependents > 3) score -= 15;
            else if (dependents > 1) score -= 5;
        }

        // Cap score
        score = Math.min(850, Math.max(300, score));

        // Calculate interest rate based on score
        let interestRate = 20;
        if (score >= 750) interestRate = 10;
        else if (score >= 700) interestRate = 14;
        else if (score >= 650) interestRate = 18;
        else if (score >= 600) interestRate = 25;
        else interestRate = 30;

        // Calculate max loan amount
        let maxLoan = Math.min(income * 0.3, 7500);
        if (debtToIncomeRatio > 0.4) maxLoan *= 0.7;
        if (score < 600) maxLoan *= 0.6;

        // Build employment summary (handle missing fields)
        let employmentSummary = "";
        if (totalYearsExperience > 0 && numberOfEmployers > 0) {
            employmentSummary = `${totalYearsExperience.toFixed(1)} years experience across ${numberOfEmployers} employer${numberOfEmployers !== 1 ? 's' : ''}`;
            if (averageJobDuration > 0) {
                employmentSummary += `, average job duration ${averageJobDuration.toFixed(1)} months`;
            }
        } else if (employmentMonths > 0) {
            employmentSummary = `${employmentMonths} months at current position`;
        } else {
            employmentSummary = "Employment information not available";
        }

        const gapInfo = longestGap > 0
            ? `, longest employment gap ${longestGap} months`
            : '';

        return {
            creditScore: score,
            maxLoanAmount: Math.max(500, Math.round(maxLoan)),
            interestRate: interestRate,
            assessment: `Credit assessment based on income of £${income.toLocaleString()}, ${employmentSummary}${gapInfo}, and ${debtToIncomeRatio > 0.4 ? 'high' : debtToIncomeRatio > 0.3 ? 'moderate' : 'low'} debt-to-income ratio.`,
            riskLevel: score >= 700 ? "low" : score >= 600 ? "medium" : "high"
        };
    }

    public async getLatestAssessment(user: User) {
        const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        if (!profile) return null;

        return await this.assessmentRepo.findOne({
            where: { profileId: profile.id },
            order: { createdAt: "DESC" }
        });
    }
}
