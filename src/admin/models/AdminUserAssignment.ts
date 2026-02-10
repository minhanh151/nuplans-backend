import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "../../models/BaseEntity";
import { Admin } from "./Admin";
import { User } from "../../models/User";

@Entity("admin_user_assignments")
@Unique(["adminId", "userId"])
export class AdminUserAssignment extends BaseEntity {
    @Column({ name: "admin_id" })
    adminId!: string;

    @ManyToOne(() => Admin)
    @JoinColumn({ name: "admin_id" })
    admin!: Admin;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;
}
