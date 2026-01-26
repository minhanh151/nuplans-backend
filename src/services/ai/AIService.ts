import { AIProviderType, IAIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { MilestoneActionAIProvider } from "./OpenAI/MilestoneActionAIProvider";
import { ParseCvAIProvider } from "./OpenAI/ParseCvAIProvider";
import { PlanningAIProvider } from "./OpenAI/PlanningAIProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import config from "@/config/config";

export class AIService {
    private static instance: AIService;
    private providers: Map<string, IAIProvider> = new Map();

    private constructor() {
        // Initialize default providers from config
        if (config.AI.GEMINI_API_KEY) {
            this.providers.set(AIProviderType.GEMINI, new GeminiProvider(
                config.AI.GEMINI_API_KEY,
                config.AI.GEMINI_MODEL
            ));
        }
        if (config.AI.OPENAI_API_KEY) {
            this.providers.set(AIProviderType.OPENAI, new OpenAIProvider(
                config.AI.OPENAI_API_KEY,
                config.AI.OPENAI_MODEL,
                config.AI.OPENAI_BASE_URL
            ));
        }
        this.providers.set(AIProviderType.MILESTONE_ACTION_OPENAI, new MilestoneActionAIProvider());
        this.providers.set(AIProviderType.PLANNING_OPENAI, new PlanningAIProvider());
        this.providers.set(AIProviderType.PARSE_CV, new ParseCvAIProvider());
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public getProvider(type: AIProviderType = AIProviderType.GEMINI): IAIProvider {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`AI Provider ${type} not configured`);
        }
        return provider;
    }
}
