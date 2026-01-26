import { StorageService } from "./storage/StorageService";
import { FileParserService } from "./FileParserService";
import { AIService } from "./ai/AIService";
import { AIProviderType } from "./ai/AIProvider";
import logger from "@/utils/logger";

export class CVService {
    public async parseCV(filePath: string) {
        const storageService = StorageService.getInstance();
        const { data, mimeType } = await storageService.downloadFile(filePath);

        const text = await FileParserService.extractText(data, mimeType);
        logger.info(text);

        if (!text || text.length < 100) {
            return this.normalizeExtractedData(this.getDefaultExtractedData());
        }

        const maxTextLength = 15000;
        const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) + "\n\n[Content truncated...]" : text;

        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.PARSE_CV);

        const instruction = this.getParseCVInstruction();
        const aiRes = await aiProvider.generateContent({
            systemInstruction: instruction,
            content: `Parse this CV and extract ALL available information:\n\n${truncatedText}`
        });

        let extractedData;
        try {
            let cleanedText = aiRes.content.trim();
            if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];

            extractedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI response:", aiRes.content);
            extractedData = this.getDefaultExtractedData();
        }

        return this.normalizeExtractedData(extractedData);
    }

    private getDefaultExtractedData() {
        return {
            full_name: null,
            email: null,
            phone: null,
            address: null,
            date_of_birth: null,
            employment_status: null,
            employer_name: null,
            job_title: null,
            annual_income: null,
            employment_duration_months: null,
            employment_history: [],
            total_years_experience: null,
            number_of_employers: 0,
            skills: [],
            education: [],
            certifications: []
        };
    }

    private normalizeExtractedData(data: any) {
        const defaults = this.getDefaultExtractedData();
        return {
            full_name: data.full_name || defaults.full_name,
            email: data.email || defaults.email,
            phone: data.phone || defaults.phone,
            address: data.address || defaults.address,
            date_of_birth: data.date_of_birth || defaults.date_of_birth,
            employment_status: data.employment_status || defaults.employment_status,
            employer_name: data.employer_name || defaults.employer_name,
            job_title: data.job_title || defaults.job_title,
            annual_income: data.annual_income || defaults.annual_income,
            employment_duration_months: data.employment_duration_months || defaults.employment_duration_months,
            employment_history: Array.isArray(data.employment_history) ? data.employment_history : [],
            total_years_experience: data.total_years_experience || defaults.total_years_experience,
            number_of_employers: data.number_of_employers || defaults.number_of_employers,
            skills: Array.isArray(data.skills) ? data.skills.filter((s: any) => s && s.toString().trim()) : [],
            education: Array.isArray(data.education) ? data.education : [],
            certifications: Array.isArray(data.certifications) ? data.certifications.filter((c: any) => c && c.toString().trim()) : []
        };
    }

    private getParseCVInstruction(): string {
        return `You are an expert CV parser. Your task is to extract COMPREHENSIVE information from the CV text provided. Extract EVERY piece of information you can find - do not leave fields empty if the information exists in the CV.

CRITICAL: Extract ALL available information. If information exists in the CV, you MUST include it in the response. Only use null if the information truly does not exist.

Return ONLY a valid JSON object with these exact fields (use null ONLY if information truly doesn't exist):

{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "date_of_birth": "YYYY-MM-DD or null",
  "employment_status": "string (Full-time/Part-time/Contract/etc)",
  "employer_name": "string (current or most recent employer)",
  "job_title": "string (current or most recent position)",
  "annual_income": "number (extract from salary info if available)",
  "employment_duration_months": "number (calculate from employment dates)",
  "employment_history": [
    {
      "employer_name": "string",
      "job_title": "string",
      "start_date": "YYYY-MM-DD or YYYY-MM or YYYY",
      "end_date": "YYYY-MM-DD or YYYY-MM or YYYY or 'present' or 'current'",
      "employment_type": "string (Full-time/Part-time/Contract/Temporary/Freelance)",
      "salary": "number (if mentioned)",
      "duration_months": "number (calculated)",
      "is_current": "boolean"
    }
  ],
  "total_years_experience": "number (total years across all jobs)",
  "number_of_employers": "number (count of unique employers)",
  "skills": ["string (array of technical and soft skills)"],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_date": "YYYY-MM-DD or YYYY-MM or YYYY",
      "end_date": "YYYY-MM-DD or YYYY-MM or YYYY or 'present'",
      "is_completed": "boolean"
    }
  ],
  "certifications": ["string (array of certifications/licenses)"]
}

CRITICAL EXTRACTION INSTRUCTIONS:
1. PERSONAL INFORMATION: Extract full name, email, phone, address, date of birth if mentioned anywhere in the CV
2. EMPLOYMENT: Extract ALL employment history entries - every job, internship, contract position mentioned
   - Include employer name, job title, start date, end date (or "present" if current)
   - Calculate employment_duration_months for current/most recent job
   - Extract employment type (Full-time, Part-time, Contract, etc.)
   - Extract salary if mentioned
3. SKILLS: Extract EVERY skill mentioned - technical skills, programming languages, software, tools, soft skills, methodologies
4. EDUCATION: Extract ALL education entries - every degree, diploma, certificate, course mentioned
   - Include institution name, degree type, field of study, dates
5. CERTIFICATIONS: Extract ALL certifications, licenses, professional qualifications mentioned
6. CALCULATIONS:
   - Calculate duration_months for each job position
   - Calculate total_years_experience: sum of all employment durations
   - Count number_of_employers: unique employer names
   - Sort employment_history by start_date (most recent first)
7. DATE FORMATTING: Use YYYY-MM-DD format when possible, or YYYY-MM, or YYYY as fallback
8. ARRAYS: Always return arrays even if empty: skills: [], education: [], certifications: [], employment_history: []

EXAMPLES:
- If CV mentions "JavaScript, Python, React" → skills: ["JavaScript", "Python", "React"]
- If CV has 3 jobs → employment_history: [job1, job2, job3] (all of them)
- If CV mentions "Bachelor's in Computer Science" → education: [{institution: "...", degree: "Bachelor's", field_of_study: "Computer Science"}]

IMPORTANT: Extract EVERYTHING you can find. Be thorough. Return ONLY the JSON object, no markdown, no explanations, no additional text.`;
    }
}
