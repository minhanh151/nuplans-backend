import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { ChatMessage } from "./ChatMessage";

@Entity("message_actions")
export class MessageAction {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "message_id" })
    messageId!: string;

    @ManyToOne(() => ChatMessage, (msg) => msg.actions)
    @JoinColumn({ name: "message_id" })
    message!: ChatMessage;

    @Column({ name: "action_type", length: 100, nullable: true })
    actionType?: string;

    @Column({ type: "text", nullable: true })
    label?: string;

    @Column({ type: "jsonb", name: "action_data", default: {} })
    actionData!: any;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;
}
