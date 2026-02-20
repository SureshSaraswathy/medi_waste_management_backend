import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum BatchType {
  MANUAL = 'manual',
  WEIGHT = 'weight',
  BED = 'bed',
}

export enum BatchStatus {
  STAGED = 'STAGED',
  PROCESSING = 'PROCESSING',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
}

/**
 * Invoice Batch Entity - Transaction Database
 * Represents a batch of invoices to be generated and posted
 */
@Entity('invoice_batch')
@Index(['companyId', 'status'])
@Index(['status'])
@Index(['createdAt'])
export class InvoiceBatchEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 20, name: 'type' })
  type: BatchType;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'site_id', nullable: true })
  siteId: string | null;

  @Column({ type: 'date', name: 'period_from', nullable: true })
  periodFrom: Date | null;

  @Column({ type: 'date', name: 'period_to', nullable: true })
  periodTo: Date | null;

  @Column({ type: 'varchar', length: 20, name: 'billing_month', nullable: true })
  billingMonth: string | null; // Format: "2024-01" or "January 2024"

  @Column({ type: 'varchar', length: 20, name: 'status', default: BatchStatus.STAGED })
  status: BatchStatus;

  @Column({ type: 'integer', name: 'total_records', default: 0 })
  totalRecords: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'posted_at', nullable: true })
  postedAt: Date | null;
}
