import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../models/BaseEntity";

export enum AdminRole {
    MASTER_ADMIN = "master_admin",
    ADMIN = "admin"
}

@Entity("admins")
export class Admin extends BaseEntity {
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    name?: string;

    @Column({
        type: "varchar",
        default: AdminRole.ADMIN
    })
    role!: AdminRole;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @Column({ name: "locked_at", nullable: true, type: "timestamp with time zone" })
    lockedAt?: Date;

    @Column({ name: "last_login_at", nullable: true, type: "timestamp with time zone" })
    lastLoginAt?: Date;
}
