import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('etp_registers')
@Index(['companyId', 'date'], { where: 'is_deleted = false' })
@Index(['etpRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class ETPRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'etp_id' })
  etpId: string;

  @Column({ type: 'varchar', length: 50, name: 'etp_reg_num', unique: true })
  etpRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'inflow' })
  inflow: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'treated' })
  treated: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'ph' })
  ph: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'bod' })
  bod: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cod' })
  cod: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tss' })
  tss: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'oil_grease' })
  oilGrease: number;

  @Column({ type: 'varchar', length: 100, name: 'discharge_mode' })
  dischargeMode: string;

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
