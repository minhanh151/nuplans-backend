import { createClient, SupabaseClient } from "@supabase/supabase-js";
import config from "../../config/config";

export class StorageService {
    private static instance: StorageService;
    private supabase: SupabaseClient;

    private constructor() {
        this.supabase = createClient(
            config.STORAGE.SUPABASE_URL,
            config.STORAGE.SUPABASE_KEY
        );
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async downloadFile(path: string, bucket: string = config.STORAGE.CV_BUCKET): Promise<{ data: Buffer; mimeType: string }> {
        if (!path) {
            throw new Error("StorageService: Path is required for downloadFile");
        }
        const { data, error } = await this.supabase.storage.from(bucket).download(path);

        if (error) {
            throw error;
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            data: buffer,
            mimeType: data.type
        };
    }

    async downloadFileAsBase64(path: string, bucket: string = config.STORAGE.CV_BUCKET): Promise<{ data: string; mimeType: string }> {
        const { data, mimeType } = await this.downloadFile(path, bucket);
        return {
            data: data.toString('base64'),
            mimeType
        };
    }

    async uploadFile(path: string, file: Buffer, mimeType: string, bucket: string = config.STORAGE.CV_BUCKET): Promise<void> {
        const { error } = await this.supabase.storage.from(bucket).upload(path, file, {
            contentType: mimeType,
            upsert: true
        });

        if (error) {
            throw error;
        }
    }
}
