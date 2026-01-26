import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('payment_allocations')
@Index(['paymentId'], { where: 'is_deleted = false' })
@Index(['invoiceId'], { where: 'is_deleted = false' })
export class PaymentAllocationEntity {
  @PrimaryColumn({ type: 'uuid', name: 'allocation_id' })
  allocationId: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'allocated_amount' })
  allocatedAmount: number;

  @CreateDateColumn({ type: 'timestamp', name: 'allocation_date' })
  allocationDate: Date;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
