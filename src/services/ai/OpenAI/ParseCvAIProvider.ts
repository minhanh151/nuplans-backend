import config from "@/config/config";
import { GeminiProvider } from "../GeminiProvider";

export class ParseCvAIProvider extends GeminiProvider {

    constructor() {
        const apiKey = config.AI.PARSE_CV_API_KEY || config.AI.GEMINI_API_KEY;
        const configModel = config.AI.PARSE_CV_API_MODEL || config.AI.GEMINI_MODEL;
        super(apiKey, configModel);
    }
}
