import config from "@/config/config";
import { OpenAIProvider } from "../OpenAIProvider";

export class PlanningAIProvider extends OpenAIProvider {

    constructor() {
        const apiKey = config.AI.PLANNING_OPENAI_API_KEY || config.AI.OPENAI_API_KEY;
        const baseURL = config.AI.PLANNING_OPENAI_API_BASE_URL || config.AI.OPENAI_BASE_URL;
        const configModel = config.AI.PLANNING_OPENAI_API_MODEL || config.AI.OPENAI_MODEL;
        super(apiKey, configModel, baseURL);
    }
}
