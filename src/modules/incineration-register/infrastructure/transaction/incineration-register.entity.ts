import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('incineration_registers')
@Index(['companyId', 'incinerationDate'], { where: 'is_deleted = false' })
@Index(['inciRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class IncinerationRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'incineration_id' })
  incinerationId: string;

  @Column({ type: 'varchar', length: 50, name: 'inci_reg_num', unique: true })
  inciRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'incineration_date' })
  incinerationDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'equipment_id' })
  equipmentId: string;

  @Column({ type: 'varchar', length: 100, name: 'secondary_chamber_id' })
  secondaryChamberId: string;

  @Column({ type: 'varchar', length: 50, name: 'batch_no' })
  batchNo: string;

  @Column({ type: 'varchar', length: 100, name: 'waste_category' })
  wasteCategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'waste_qty_kg' })
  wasteQtyKg: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'avg_temp_c' })
  avgTempC: number;

  @Column({ type: 'integer', name: 'retention_time_sec' })
  retentionTimeSec: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'fuel_used_l' })
  fuelUsedL: number;

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
