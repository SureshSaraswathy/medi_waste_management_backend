import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * TypeORM Entity - Infrastructure layer
 * User Employee Profile (Step 2)
 */
@Entity('user_employee_profiles')
@Index(['userId'], { unique: true })
export class UserEmployeeProfileEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'profile_id' })
  profileId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50, name: 'employment_type', nullable: true })
  employmentType: string | null; // 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation: string | null;

  @Column({ type: 'varchar', length: 200, name: 'contractor_name', nullable: true })
  contractorName: string | null;

  @Column({ type: 'varchar', length: 200, name: 'company_name_third_party', nullable: true })
  companyNameThirdParty: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_salary', nullable: true })
  grossSalary: number | null;

  @Column({ type: 'varchar', length: 255, name: 'email_address', nullable: true })
  emailAddress: string | null;

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
