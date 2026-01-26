import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WasteProcessStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  VERIFIED = 'Verified',
  CLOSED = 'Closed',
}

@Entity('waste_processes')
@Index(['companyId', 'processDate'], { unique: true, where: 'is_deleted = false' })
@Index(['processDate'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
export class WasteProcessEntity {
  @PrimaryColumn({ type: 'uuid', name: 'waste_process_id' })
  wasteProcessId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'process_date' })
  processDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'incineration_weight_kg' })
  incinerationWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'autoclave_weight_kg' })
  autoclaveWeightKg: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'status',
    default: WasteProcessStatus.DRAFT,
  })
  status: WasteProcessStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy: string | null;

  @Column({ type: 'timestamp', name: 'verified_on', nullable: true })
  verifiedOn: Date | null;

  @Column({ type: 'uuid', name: 'closed_by', nullable: true })
  closedBy: string | null;

  @Column({ type: 'timestamp', name: 'closed_on', nullable: true })
  closedOn: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
