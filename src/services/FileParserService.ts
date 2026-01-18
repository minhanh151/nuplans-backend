import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export class FileParserService {
    public static async parsePDF(buffer: Buffer): Promise<string> {
        try {
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy(); // Clean up parser resources
            return data.text;
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw new Error("Failed to parse PDF");
        }
    }

    public static async parseDocx(buffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (error) {
            console.error("Error parsing DOCX:", error);
            throw new Error("Failed to parse DOCX");
        }
    }

    public static async extractText(buffer: Buffer, mimeType: string): Promise<string> {
        if (mimeType === 'application/pdf') {
            return await this.parsePDF(buffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
            return await this.parseDocx(buffer);
        } else if (mimeType.startsWith('text/')) {
            return buffer.toString('utf-8');
        }
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }
}
