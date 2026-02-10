import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../models/BaseEntity";
import { Admin } from "./Admin";

@Entity("admin_refresh_tokens")
export class AdminRefreshToken extends BaseEntity {
    @Column()
    token!: string;

    @Column({ name: "admin_id" })
    adminId!: string;

    @ManyToOne(() => Admin)
    @JoinColumn({ name: "admin_id" })
    admin!: Admin;

    @Column({ name: "expires_at", type: "timestamp with time zone" })
    expiresAt!: Date;
}
