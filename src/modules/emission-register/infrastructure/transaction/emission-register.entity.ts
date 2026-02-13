import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('emission_registers')
@Index(['companyId', 'emissionDate'], { where: 'is_deleted = false' })
@Index(['emisRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class EmissionRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'emission_id' })
  emissionId: string;

  @Column({ type: 'varchar', length: 50, name: 'emis_reg_num', unique: true })
  emisRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'emission_date' })
  emissionDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'equipment_id' })
  equipmentId: string;

  @Column({ type: 'varchar', length: 100, name: 'stack_id' })
  stackId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'pm' })
  pm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'co' })
  co: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'hci' })
  hci: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'temp' })
  temp: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'oxygen' })
  oxygen: number;

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
