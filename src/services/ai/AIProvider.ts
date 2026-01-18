export enum AIProviderType {
    GEMINI = 'GEMINI',
    OPENAI = 'OPENAI',
    CUSTOM = 'CUSTOM'
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
