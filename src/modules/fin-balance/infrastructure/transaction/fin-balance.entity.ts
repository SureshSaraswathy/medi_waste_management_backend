import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * FinBalance Entity - Transaction Database
 * Stores financial balance information for HCFs
 */
@Entity('fin_balance')
@Index(['companyId', 'hcfId'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId'], { where: 'is_deleted = false' })
@Index(['hcfId'], { where: 'is_deleted = false' })
export class FinBalanceEntity {
  @PrimaryColumn({ type: 'uuid', name: 'fin_balance_id' })
  finBalanceId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'opening_balance' })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'boolean', name: 'is_manual', default: true })
  isManual: boolean;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', nullable: true, name: 'modified_by' })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
