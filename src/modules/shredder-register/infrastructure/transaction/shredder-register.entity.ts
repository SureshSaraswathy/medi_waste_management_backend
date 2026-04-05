import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('shredder_registers')
@Index(['companyId', 'shredderDate'], { where: 'is_deleted = false' })
@Index(['shredRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class ShredderRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'shredder_id' })
  shredderId: string;

  @Column({ type: 'varchar', length: 50, name: 'shred_reg_num', unique: true })
  shredRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'shredder_date' })
  shredderDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'equipment_id' })
  equipmentId: string;

  @Column({ type: 'varchar', length: 50, name: 'batch_no' })
  batchNo: string;

  @Column({ type: 'varchar', length: 100, name: 'waste_category' })
  wasteCategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'waste_qty_kg', nullable: true })
  wasteQtyKg: number | null;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'temperature_c', nullable: true })
  temperatureC: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'pressure_bar', nullable: true })
  pressureBar: number | null;

  @Column({ type: 'integer', name: 'cycle_time_min' })
  cycleTimeMin: number;

  @Column({ type: 'varchar', length: 20, name: 'indicator_result' })
  indicatorResult: string;

  @Column({ type: 'varchar', length: 50, name: 'compliance_status' })
  complianceStatus: string;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'Active' })
  status: 'Active' | 'Inactive';

  @Column({ type: 'varchar', length: 100, name: 'input_source_type', nullable: true })
  inputSourceType?: string;

  @Column({ type: 'varchar', length: 100, name: 'input_source_ref', nullable: true })
  inputSourceRef?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'input_qty_kg', nullable: true })
  inputQtyKg?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'output_qty_kg', nullable: true })
  outputQtyKg?: number;

  @Column({ type: 'varchar', length: 50, name: 'blade_condition', nullable: true })
  bladeCondition?: string;

  @Column({ type: 'varchar', length: 200, name: 'output_dispatched_to', nullable: true })
  outputDispatchedTo?: string;

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
