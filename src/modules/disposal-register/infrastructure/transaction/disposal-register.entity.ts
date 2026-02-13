import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('disposal_registers')
@Index(['companyId', 'disposalDate'], { where: 'is_deleted = false' })
@Index(['dispoRegNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['complianceStatus'], { where: 'is_deleted = false' })
export class DisposalRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'disposal_id' })
  disposalId: string;

  @Column({ type: 'varchar', length: 50, name: 'dispo_reg_num', unique: true })
  dispoRegNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'disposal_date' })
  disposalDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'source_treatment_type' })
  sourceTreatmentType: string;

  @Column({ type: 'varchar', length: 100, name: 'source_batch_ref' })
  sourceBatchRef: string;

  @Column({ type: 'varchar', length: 100, name: 'waste_type' })
  wasteType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantity_kg' })
  quantityKg: number;

  @Column({ type: 'varchar', length: 100, name: 'disposal_method' })
  disposalMethod: string;

  @Column({ type: 'varchar', length: 255, name: 'disposal_site' })
  disposalSite: string;

  @Column({ type: 'varchar', length: 50, name: 'transport_mode' })
  transportMode: string;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_no' })
  vehicleNo: string;

  @Column({ type: 'varchar', length: 100, name: 'manifest_no' })
  manifestNo: string;

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
