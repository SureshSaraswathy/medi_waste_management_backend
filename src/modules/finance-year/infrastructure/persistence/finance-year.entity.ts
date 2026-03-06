import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('finance_year_master')
  @Index(['status'], { where: 'is_deleted = false' })
  @Index(['finYear'], { unique: true, where: 'is_deleted = false' })
export class FinanceYearEntity {
  @PrimaryColumn({ type: 'uuid', name: 'finance_year_id' })
  financeYearId: string;

  @Column({ type: 'varchar', length: 7, name: 'fin_year' })
  finYear: string; // Format: YYYY-YY (e.g., 2025-26)

  @Column({ type: 'date', name: 'fy_start_date' })
  fyStartDate: Date;

  @Column({ type: 'date', name: 'fy_end_date' })
  fyEndDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: MasterStatus.ACTIVE,
  })
  status: MasterStatus;

  @Column({ type: 'varchar', length: 50, name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'varchar', length: 50, name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
