import { StoredEvent } from "@/models/StoredEvent";

export interface EventHandler {
    processEvent(event: StoredEvent): Promise<void>;
    createEvent(eventData: any): Promise<StoredEvent>;
}