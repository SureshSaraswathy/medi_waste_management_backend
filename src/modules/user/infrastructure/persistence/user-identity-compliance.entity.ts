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
 * User Identity & Compliance (Step 3)
 */
@Entity('user_identity_compliance')
@Index(['userId'], { unique: true })
@Index(['aadhaarNumber'], { where: 'aadhaar_number IS NOT NULL' })
@Index(['panNumber'], { where: 'pan_number IS NOT NULL' })
export class UserIdentityComplianceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'compliance_id' })
  complianceId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 20, name: 'aadhaar_number', nullable: true })
  aadhaarNumber: string | null;

  @Column({ type: 'varchar', length: 20, name: 'pan_number', nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', length: 50, name: 'driving_license_number', nullable: true })
  drivingLicenseNumber: string | null;

  @Column({ type: 'varchar', length: 50, name: 'pf_number', nullable: true })
  pfNumber: string | null;

  @Column({ type: 'varchar', length: 50, name: 'uan_number', nullable: true })
  uanNumber: string | null;

  @Column({ type: 'varchar', length: 50, name: 'esi_number', nullable: true })
  esiNumber: string | null;

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
