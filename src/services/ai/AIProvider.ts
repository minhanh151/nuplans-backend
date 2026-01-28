export enum AIProviderType {
    GEMINI = 'GEMINI',
    OPENAI = 'OPENAI',
    CUSTOM = 'CUSTOM',
    MILESTONE_ACTION_OPENAI = 'MILESTONE_ACTION_OPENAI',
    PLANNING_OPENAI = 'PLANNING_OPENAI',
    PARSE_CV = 'PARSE_CV'
}

export interface AIResponse {
    content: string;
    model: string;
    provider: AIProviderType;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AIRequest {
    systemInstruction: string;
    content: string;
    files?: Array<{
        data: string; // base64
        mimeType: string;
    }>;
}

export interface IAIProvider {
    generateContent(request: AIRequest): Promise<AIResponse>;
}
