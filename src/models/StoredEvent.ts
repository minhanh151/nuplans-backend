import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("stored_events")
export class StoredEvent {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "event_type", type: "text" })
    eventType!: string;

    @Column({ name: "event_data", type: "jsonb" })
    eventData!: any;

    @Column({ name: "retry_count", type: "integer", default: 0 })
    retryCount!: number;

    @Column({ name: "status", type: "smallint", default: 0 })
    status!: number;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}
