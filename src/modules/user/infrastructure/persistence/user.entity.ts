import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserStatus } from '../../domain/entities/user.domain.entity';

/**
 * TypeORM Entity - Infrastructure layer
 * Maps database schema to domain entity
 */
@Entity('users')
@Index(['companyId', 'mobileNumber'], { unique: true, where: '"is_deleted" = false' })
@Index(['companyId', 'userName'], { unique: true, where: '"is_deleted" = false' })
export class UserEntity {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 100, name: 'user_name' })
  userName: string;

  @Column({ type: 'varchar', length: 20, name: 'mobile_number' })
  mobileNumber: string;

  @Column({ type: 'varchar', length: 50, name: 'employee_code', nullable: true })
  employeeCode: string | null;

  @Column({ type: 'uuid', name: 'user_role_id', nullable: true })
  userRoleId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'status',
    default: UserStatus.DRAFT,
  })
  status: UserStatus;

  @Column({ type: 'boolean', name: 'password_enabled', default: false })
  passwordEnabled: boolean;

  @Column({ type: 'boolean', name: 'otp_enabled', default: false })
  otpEnabled: boolean;

  @Column({ type: 'boolean', name: 'force_otp_on_next_login', default: false })
  forceOtpOnNextLogin: boolean;

  @Column({ type: 'boolean', name: 'web_login', default: false })
  webLogin: boolean;

  @Column({ type: 'boolean', name: 'mobile_app_access', default: false })
  mobileAppAccess: boolean;

  @Column({ type: 'varchar', length: 255, name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'boolean', name: 'force_password_change', default: false })
  forcePasswordChange: boolean;

  @Column({ type: 'varchar', length: 255, name: 'temporary_password', nullable: true })
  temporaryPassword: string | null;

  @Column({ type: 'timestamp', name: 'temporary_password_expiry', nullable: true })
  temporaryPasswordExpiry: Date | null;

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
