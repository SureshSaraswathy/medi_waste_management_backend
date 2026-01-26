import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'Draft',
  GENERATED = 'Generated',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid',
  CANCELLED = 'Cancelled',
}

export enum BillingType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
}

export enum BillingOption {
  BED_WISE = 'Bed-wise',
  WEIGHT_WISE = 'Weight-wise',
  LUMPSUM = 'Lumpsum',
}

export enum InvoiceGenerationType {
  AUTO = 'Auto',
  MANUAL = 'Manual',
}

/**
 * Invoice Entity - Transaction Database
 * Stores invoice information for waste management billing
 */
@Entity('invoices')
@Index(['companyId', 'invoiceDate'], { where: 'is_deleted = false' })
@Index(['hcfId', 'invoiceDate'], { where: 'is_deleted = false' })
@Index(['invoiceNumber'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['invoiceDate'], { where: 'is_deleted = false' })
@Index(['financialYear'], { where: 'is_deleted = false' })
export class InvoiceEntity {
  @PrimaryColumn({ type: 'uuid', name: 'invoice_id' })
  invoiceId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'varchar', length: 50, name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate: Date;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 20, name: 'billing_type' })
  billingType: BillingType;

  @Column({ type: 'integer', name: 'billing_days', nullable: true })
  billingDays: number | null;

  @Column({ type: 'varchar', length: 20, name: 'billing_option' })
  billingOption: BillingOption;

  @Column({ type: 'varchar', length: 20, name: 'generation_type', default: InvoiceGenerationType.MANUAL })
  generationType: InvoiceGenerationType;

  // Bed-wise billing fields
  @Column({ type: 'integer', name: 'bed_count', nullable: true })
  bedCount: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'bed_rate', nullable: true })
  bedRate: number | null;

  // Weight-wise billing fields
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'weight_in_kg', nullable: true })
  weightInKg: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'kg_rate', nullable: true })
  kgRate: number | null;

  // Lumpsum amount
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'lumpsum_amount', nullable: true })
  lumpsumAmount: number | null;

  // Tax calculation fields
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'taxable_value', default: 0 })
  taxableValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'igst', default: 0 })
  igst: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cgst', default: 0 })
  cgst: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sgst', default: 0 })
  sgst: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'round_off', default: 0 })
  roundOff: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'invoice_value', default: 0 })
  invoiceValue: number;

  // Payment tracking
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_paid_amount', default: 0 })
  totalPaidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'balance_amount', default: 0 })
  balanceAmount: number;

  // Status and lock
  @Column({ type: 'varchar', length: 20, name: 'status', default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'boolean', name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ type: 'date', name: 'locked_after_date', nullable: true })
  lockedAfterDate: Date | null;

  // Financial year tracking
  @Column({ type: 'varchar', length: 10, name: 'financial_year' })
  financialYear: string; // Format: "2024-25"

  @Column({ type: 'integer', name: 'sequence_number' })
  sequenceNumber: number;

  // Auto-generation metadata
  @Column({ type: 'date', name: 'billing_period_start', nullable: true })
  billingPeriodStart: Date | null;

  @Column({ type: 'date', name: 'billing_period_end', nullable: true })
  billingPeriodEnd: Date | null;

  // Notes and remarks
  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;

  // Audit fields
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
