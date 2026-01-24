import OpenAI from "openai";
import { AIProviderType, AIRequest, AIResponse, IAIProvider } from "./AIProvider";
import logger from "@/utils/logger";

export class OpenAIProvider implements IAIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = "gpt-4-turbo", baseURL?: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL
        });
        this.model = model;
    }

    async generateContent(request: AIRequest): Promise<AIResponse> {
        const messages: any[] = [
            { role: "system", content: request.systemInstruction },
            { role: "user", content: request.content }
        ];

        // Note: Image support for OpenAI would need more adjustments (e.g. gpt-4-vision-preview)
        // For now keeping it simple as per edge function logic which mostly used text or had different logic for images

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages,
        });

        const choice = response.choices[0];
        const text = choice.message.content || "";
        logger.info(`OpenAIProvider response: ${text}`);

        return {
            content: text,
            model: this.model,
            provider: AIProviderType.OPENAI,
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0
            }
        };
    }
}
