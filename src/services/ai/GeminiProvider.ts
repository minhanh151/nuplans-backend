import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProviderType, AIRequest, AIResponse, IAIProvider } from "./AIProvider";
import logger from "@/utils/logger";

export class GeminiProvider implements IAIProvider {
    private genAI: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string = "gemini-1.5-flash") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async generateContent(request: AIRequest): Promise<AIResponse> {
        const genModel = this.genAI.getGenerativeModel({
            model: this.model,
            systemInstruction: request.systemInstruction,
        });

        const contents: any[] = [{ text: request.content }];

        if (request.files && request.files.length > 0) {
            request.files.forEach(img => {
                contents.push({
                    inlineData: {
                        data: img.data,
                        mimeType: img.mimeType
                    }
                });
            });
        }

        const result = await genModel.generateContent(contents);
        const response = await result.response;

        const text = response.text();
        logger.info(`GeminiProvider response: ${text}`);

        return {
            content: text,
            model: this.model,
            provider: AIProviderType.GEMINI,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0
            }
        };
    }
}
