import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('training_certificates')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['certificateNo', 'companyId'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId'], { where: 'is_deleted = false' })
@Index(['hcfId'], { where: 'is_deleted = false' })
@Index(['trainingDate'], { where: 'is_deleted = false' })
export class TrainingCertificateEntity {
  @PrimaryColumn({ type: 'uuid', name: 'certificate_id' })
  certificateId: string;

  @Column({ type: 'varchar', length: 100, name: 'certificate_no' })
  certificateNo: string;

  @Column({ type: 'varchar', length: 200, name: 'staff_name' })
  staffName: string;

  @Column({ type: 'varchar', length: 50, name: 'staff_code' })
  staffCode: string;

  @Column({ type: 'varchar', length: 100, name: 'designation', nullable: true })
  designation: string | null;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'date', name: 'training_date' })
  trainingDate: Date;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 200, name: 'trained_by' })
  trainedBy: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: MasterStatus.ACTIVE,
  })
  status: MasterStatus;

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
