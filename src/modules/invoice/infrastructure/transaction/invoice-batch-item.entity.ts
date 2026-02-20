import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceBatchEntity } from './invoice-batch.entity';

/**
 * Invoice Batch Item Entity - Transaction Database
 * Represents individual invoice items within a batch
 */
@Entity('invoice_batch_items')
@Index(['batchId'])
@Index(['customerId'])
@Index(['isSelected'])
export class InvoiceBatchItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => InvoiceBatchEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: InvoiceBatchEntity;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string; // This is hcf_id

  @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantity', default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rate', default: 0 })
  rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_percent', default: 0 })
  taxPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount', default: 0 })
  amount: number;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'boolean', name: 'error_flag', default: false })
  errorFlag: boolean;

  @Column({ type: 'varchar', length: 500, name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'boolean', name: 'is_selected', default: true })
  isSelected: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
