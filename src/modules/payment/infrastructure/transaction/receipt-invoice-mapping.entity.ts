import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('receipt_invoice_mappings')
@Index(['receiptId'], { where: 'is_deleted = false' })
@Index(['invoiceId'], { where: 'is_deleted = false' })
export class ReceiptInvoiceMappingEntity {
  @PrimaryColumn({ type: 'uuid', name: 'mapping_id' })
  mappingId: string;

  @Column({ type: 'uuid', name: 'receipt_id' })
  receiptId: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'allocated_amount' })
  allocatedAmount: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
