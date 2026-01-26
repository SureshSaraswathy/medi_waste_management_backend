import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMode } from '../../domain/entities/payment.domain.entity';

// Re-export enums for use in other modules
export { PaymentStatus, PaymentMode };

@Entity('payments')
@Index(['companyId', 'paymentDate'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['receiptId'], { where: 'is_deleted = false' })
export class PaymentEntity {
  @PrimaryColumn({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'payment_date' })
  paymentDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'payment_amount' })
  paymentAmount: number;

  @Column({ type: 'varchar', length: 20, name: 'payment_mode' })
  paymentMode: PaymentMode;

  @Column({ type: 'varchar', length: 100, name: 'reference_number', nullable: true })
  referenceNumber: string | null;

  @Column({ type: 'varchar', length: 100, name: 'bank_name', nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', length: 50, name: 'cheque_number', nullable: true })
  chequeNumber: string | null;

  @Column({ type: 'date', name: 'cheque_date', nullable: true })
  chequeDate: Date | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'receipt_id', nullable: true })
  receiptId: string | null;

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
