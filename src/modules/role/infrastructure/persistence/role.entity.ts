import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RoleStatus, AccessLevel } from '../../domain/entities/role.domain.entity';

/**
 * TypeORM Entity - Infrastructure layer
 */
@Entity('roles')
@Index(['companyId', 'roleName'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId'])
@Index(['status'], { where: 'is_deleted = false' })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
  roleId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 100, name: 'role_name' })
  roleName: string;

  @Column({ type: 'text', name: 'role_description', nullable: true })
  roleDescription: string | null;

  @Column({ type: 'varchar', length: 100, name: 'landing_page', nullable: true })
  landingPage: string | null;

  @Column({ type: 'varchar', length: 20, name: 'access_level', nullable: true })
  accessLevel: AccessLevel | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: RoleStatus.ACTIVE,
  })
  status: RoleStatus;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
