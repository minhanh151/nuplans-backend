import { BaseEntity as TypeORMBaseEntity, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt!: Date | null;

  static get entityName(): string {
    return this.name;
  }

  get entityName(): string {
    return (this.constructor as typeof BaseEntity).entityName;
  }
}
