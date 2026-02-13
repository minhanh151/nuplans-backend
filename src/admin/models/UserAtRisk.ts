import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../models/User";
import { Admin } from "./Admin";

export enum RiskStatus {
    ACTIVE = 'active',
    RESOLVED = 'resolved'
}

export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

@Entity("user_at_risks")
export class UserAtRisk {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "jsonb", default: "'[]'" })
    reasons!: string[];

    @Column({ type: "varchar", length: 20, default: RiskStatus.ACTIVE })
    status!: RiskStatus;

    @Column({ name: "risk_level", type: "varchar", length: 20, default: RiskLevel.MEDIUM })
    riskLevel!: RiskLevel;

    @Column({ name: "resolved_by", type: "uuid", nullable: true })
    resolvedBy?: string;

    @ManyToOne(() => Admin)
    @JoinColumn({ name: "resolved_by" })
    resolver?: Admin;

    @Column({ name: "resolved_at", type: "timestamp with time zone", nullable: true })
    resolvedAt?: Date;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt!: Date;
}
