import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('downtime_registers')
@Index(['companyId', 'breakdownDate'], { where: 'is_deleted = false' })
@Index(['dtRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class DowntimeRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'downtime_id' })
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'dt_reg_num', unique: true })
  dtRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'breakdown_date' })
  breakdownDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'equipment_id' })
  equipmentId: string;

  @Column({ type: 'varchar', length: 100, name: 'breakdown_type' })
  breakdownType: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'downtime_hours' })
  downtimeHours: number;

  @Column({ type: 'text', name: 'cause' })
  cause: string;

  @Column({ type: 'text', name: 'action_taken' })
  actionTaken: string;

  @Column({ type: 'varchar', length: 255, name: 'spares_used' })
  sparesUsed: string;

  @Column({ type: 'varchar', length: 50, name: 'compliance_status' })
  complianceStatus: string;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'Active' })
  status: 'Active' | 'Inactive';

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
