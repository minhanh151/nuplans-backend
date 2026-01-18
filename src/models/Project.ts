import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("projects")
export class Project {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ length: 100, nullable: true })
    category?: string;

    @Column({ type: "text", nullable: true })
    impact?: string;

    @Column({ length: 50, nullable: true })
    priority?: string;

    @Column({ length: 50, default: 'planning' })
    status!: string;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;

    @Column({ type: "integer", default: 0, name: "steps_remaining" })
    stepsRemaining!: number;

    @Column({ type: "decimal", precision: 8, scale: 2, default: 0, name: "estimated_hours" })
    estimatedHours!: number;
}
