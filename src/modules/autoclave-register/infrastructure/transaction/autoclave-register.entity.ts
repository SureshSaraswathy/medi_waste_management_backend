import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('autoclave_registers')
@Index(['companyId', 'autoclaveDate'], { where: 'is_deleted = false' })
@Index(['autoclRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class AutoclaveRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'autoclave_id' })
  autoclaveId: string;

  @Column({ type: 'varchar', length: 50, name: 'autocl_reg_num', unique: true })
  autoclRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'autoclave_date' })
  autoclaveDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'equipment_id' })
  equipmentId: string;

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

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'temperature_c' })
  temperatureC: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'pressure_bar' })
  pressureBar: number;

  @Column({ type: 'integer', name: 'cycle_time_min' })
  cycleTimeMin: number;

  @Column({ type: 'varchar', length: 20, name: 'indicator_result' })
  indicatorResult: string;

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
