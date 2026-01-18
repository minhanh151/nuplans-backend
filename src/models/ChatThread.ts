import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { ThreadGroup } from "./ThreadGroup";
import { User } from "./User";
import { ChatMessage } from "./ChatMessage";
import { ThreadBadge } from "./SpecializedChatThreads";

@Entity("chat_threads")
export class ChatThread {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "group_id", nullable: true })
    groupId?: number;

    @ManyToOne(() => ThreadGroup, (group) => group.threads)
    @JoinColumn({ name: "group_id" })
    group?: ThreadGroup;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ length: 255, nullable: true })
    title?: string;

    @Column({ length: 20, default: "active" })
    status!: string;

    @Column({ type: "timestamp with time zone", name: "last_message_date", nullable: true })
    lastMessageDate?: Date;

    @Column({ name: "message_count", default: 0 })
    messageCount!: number;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => ChatMessage, (message) => message.thread)
    messages!: ChatMessage[];

    @OneToMany(() => ThreadBadge, (badge) => badge.thread)
    badges!: ThreadBadge[];

    @Column({ name: "group_object_id", nullable: true })
    groupObjectId?: number;
}
