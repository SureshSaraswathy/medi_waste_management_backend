import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('receipts')
@Index(['companyId', 'receiptDate'], { where: 'is_deleted = false' })
@Index(['receiptNumber'], { unique: true, where: 'is_deleted = false' })
@Index(['paymentId'], { where: 'is_deleted = false' })
@Index(['financialYear'], { where: 'is_deleted = false' })
export class ReceiptEntity {
  @PrimaryColumn({ type: 'uuid', name: 'receipt_id' })
  receiptId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 50, name: 'receipt_number', unique: true })
  receiptNumber: string;

  @Column({ type: 'date', name: 'receipt_date' })
  receiptDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 10, name: 'financial_year' })
  financialYear: string; // Format: "2024-25"

  @Column({ type: 'integer', name: 'sequence_number' })
  sequenceNumber: number;

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
