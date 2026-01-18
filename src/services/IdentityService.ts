import AppDataSource from "../data-source";
import { Profile } from "../models/Profile";
import { StorageService } from "./storage/StorageService";
import { AIService } from "./ai/AIService";
import { AIProviderType } from "./ai/AIProvider";
import { User } from "../models/User";
import logger from "@/utils/logger";

export class IdentityService {
    private profileRepo = AppDataSource.getRepository(Profile);

    public async verifyIdentity(user: User, photoIdPath: string, selfiePath: string) {
        logger.info(user);
        let profile = await this.profileRepo.findOne({ where: { userId: user.id } });

        if (!profile) {
            profile = this.profileRepo.create({ userId: user.id });
        }

        // 1. Update initial status
        profile.photoIdPath = photoIdPath;
        profile.selfiePath = selfiePath;
        profile.idvStatus = "processing";
        profile.idvSubmittedAt = new Date();
        await this.profileRepo.save(profile);

        // 2. Download files
        const storageService = StorageService.getInstance();
        const photoId = await storageService.downloadFileAsBase64(photoIdPath);
        const selfie = await storageService.downloadFileAsBase64(selfiePath);

        // 3. AI Verification
        const aiService = AIService.getInstance();
        const aiProvider = aiService.getProvider(AIProviderType.GEMINI);

        const prompt = `
        You are an identity verification expert. Compare the following two images:
        Image 1: A government-issued ID card/passport.
        Image 2: An identification selfie of a person holding the ID (or just their face).

        Task:
        1. Verify if Image 1 is a valid-looking government-issued ID.
        2. Compare the face on the ID in Image 1 with the face in Image 2.
        3. Determine if they are the same person.

        Return ONLY a JSON object with the following fields:
        - "isVerified": boolean
        - "confidenceScore": number (0-1)
        - "reason": string (short explanation)
        - "extractedName": string (if visible on ID)`;

        const aiRes = await aiProvider.generateContent({
            systemInstruction: prompt,
            content: "Compare these two images.",
            files: [photoId, selfie]
        });
        logger.info(aiRes);

        let aiResult;
        try {
            let cleanedText = aiRes.content.trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];
            aiResult = JSON.parse(cleanedText);
        } catch (e) {
            aiResult = { isVerified: false, reason: "Failed to parse AI response" };
        }

        // 4. Update final result
        profile.idvStatus = aiResult.isVerified ? "verified" : "failed";
        await this.profileRepo.save(profile);

        return aiResult;
    }
}
