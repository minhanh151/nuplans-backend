export class AIResponseUtils {
    public static responseToJSON(content: string): any {
        try {
            let cleanedText = content.trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI response", e);
            return {};
        }
    }
}   