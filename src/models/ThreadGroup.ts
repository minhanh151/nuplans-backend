import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { ChatThread } from "./ChatThread";

@Entity("thread_groups")
export class ThreadGroup {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    label?: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => ChatThread, (thread) => thread.group)
    threads!: ChatThread[];
}
