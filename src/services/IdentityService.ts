import AppDataSource from "../data-source";
import { Profile } from "../models/Profile";
import { StorageService } from "./storage/StorageService";
import { AIService } from "./ai/AIService";
import { AIProviderType } from "./ai/AIProvider";
import { User } from "../models/User";
import logger from "@/utils/logger";
import { EventType } from "@/interfaces/event/EventType";
import { StoredEvent } from "@/models/StoredEvent";
import { EventStatus } from "@/interfaces/event/EventStatus";
import { LessThan } from "typeorm";

export class IdentityService {
    private static instance: IdentityService;
    private profileRepo = AppDataSource.getRepository(Profile);
    private eventRepo = AppDataSource.getRepository(StoredEvent);

    public static getInstance(): IdentityService {
        if (!IdentityService.instance) {
            IdentityService.instance = new IdentityService();
        }
        return IdentityService.instance;
    }

    public async prepareVerifyIdentity(user: User, photoIdPath: string, selfiePath: string) {
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

        await this.verifyIdentity(user.id);
    }

    public async verifyIdentity(userId: string) {
        logger.info("Processing verify identity of user", userId);
        let profile = await this.profileRepo.findOne({ where: { userId } });

        if (!profile) {
            throw new Error("Profile not found");
        }
        if (!profile.photoIdPath || !profile.selfiePath) {
            throw new Error("Photo ID or selfie path not found");
        }

        // 2. Download files
        const storageService = StorageService.getInstance();
        const photoId = await storageService.downloadFileAsBase64(profile.photoIdPath);
        const selfie = await storageService.downloadFileAsBase64(profile.selfiePath);

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

        let aiResult;

        try {
            const aiRes = await aiProvider.generateContent({
                systemInstruction: prompt,
                content: "Compare these two images.",
                files: [photoId, selfie]
            });

            let cleanedText = aiRes.content.trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];
            aiResult = JSON.parse(cleanedText);
        } catch (e) {
            aiResult = { isVerified: false, reason: "Failed to parse AI response" };
        }

        // 4. Update final result
        profile.idvStatus = aiResult.isVerified ? "verified" : "failed";
        if (!aiResult.isVerified) {
            logger.error("Identity verification failed", aiResult.reason);
            throw new Error(aiResult.reason);
        }
        await this.profileRepo.save(profile);

        return aiResult;
    }

    public async verifyIdentityProcess() {
        const events = await this.eventRepo.find({ where: { eventType: EventType.VERIFY_IDENTITY, status: EventStatus.PENDING, retryCount: LessThan(3) }, take: 5 });

        const processing = events.map(event => {
            event.status = EventStatus.PROCESSING;
            return event;
        });
        await this.eventRepo.save(processing);

        for (const event of events) {
            event.retryCount++;
            try {
                await this.verifyIdentity(event.eventData.userId);
                event.status = EventStatus.COMPLETED;
            } catch (error) {
                logger.error("Error when verifying identity", error);
                event.status = EventStatus.FAILED;
            }
            await this.eventRepo.save(event);
        }
    }
}
