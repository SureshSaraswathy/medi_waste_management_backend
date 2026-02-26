import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('compliance_register')
@Index(['complianceName'], { where: 'is_deleted = false' })
@Index(['authority'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['expiryDate'], { where: 'is_deleted = false' })
export class ComplianceRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'compliance_name' })
  complianceName: string;

  @Column({ type: 'varchar', length: 100, name: 'compliance_type' })
  complianceType: string;

  @Column({ type: 'varchar', length: 255, name: 'authority' })
  authority: string;

  @Column({ type: 'varchar', length: 100, name: 'reference_number', nullable: true })
  referenceNumber: string | null;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'integer', name: 'reminder_days', nullable: true })
  reminderDays: number | null;

  @Column({ type: 'varchar', length: 50, name: 'status', default: 'Draft' })
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Draft';

  @Column({ type: 'varchar', length: 500, name: 'document_url', nullable: true })
  documentUrl: string | null;

  @Column({ type: 'text', name: 'remarks', nullable: true })
  remarks: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
