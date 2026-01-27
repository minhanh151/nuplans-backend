import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from "typeorm";
import { ChatThread } from "./ChatThread";
import { MessageAction } from "./MessageAction";

@Entity("chat_messages")
export class ChatMessage {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ChatThread, (thread) => thread.messages)
    @JoinColumn({ name: "thread_id" })
    thread!: ChatThread;

    @Column({ length: 20 })
    role!: string;

    @Column({ type: "text", nullable: true })
    content?: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @OneToMany(() => MessageAction, (action) => action.message)
    actions!: MessageAction[];
}
