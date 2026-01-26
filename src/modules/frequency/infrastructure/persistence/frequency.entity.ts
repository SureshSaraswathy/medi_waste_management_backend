import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('frequencies')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['frequencyCode', 'companyId'], { unique: true, where: 'is_deleted = false' })
@Index(['frequencyName', 'companyId'], { unique: true, where: 'is_deleted = false' })
export class FrequencyEntity {
  @PrimaryColumn({ type: 'uuid', name: 'frequency_id' })
  frequencyId: string;

  @Column({ type: 'varchar', length: 50, name: 'frequency_code' })
  frequencyCode: string;

  @Column({ type: 'varchar', length: 100, name: 'frequency_name' })
  frequencyName: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

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
