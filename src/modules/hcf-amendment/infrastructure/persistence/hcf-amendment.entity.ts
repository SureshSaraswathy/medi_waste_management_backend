import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('hcf_amendments')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['hcfId'], { where: 'is_deleted = false' })
export class HcfAmendmentEntity {
  @PrimaryColumn({ type: 'uuid', name: 'hcf_amendment_id' })
  hcfAmendmentId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'varchar', length: 100, name: 'amendment_type' })
  amendmentType: string;

  @Column({ type: 'varchar', length: 50, name: 'amendment_date' })
  amendmentDate: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, name: 'amendment_status', nullable: true })
  amendmentStatus: string | null;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'varchar', length: 50, name: 'approved_date', nullable: true })
  approvedDate: string | null;

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
