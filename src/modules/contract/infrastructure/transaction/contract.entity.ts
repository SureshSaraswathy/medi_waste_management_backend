import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('contracts')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['contractNum', 'companyId'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId'], { where: 'is_deleted = false' })
@Index(['hcfId'], { where: 'is_deleted = false' })
export class ContractEntity {
  @PrimaryColumn({ type: 'uuid', name: 'contract_id' })
  contractId: string;

  @Column({ type: 'varchar', length: 100, name: 'contract_id_display' })
  contractID: string;

  @Column({ type: 'varchar', length: 200, name: 'contract_num' })
  contractNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 20, name: 'billing_type' })
  billingType: 'Bed' | 'Kg' | 'Lumpsum';

  @Column({ type: 'varchar', length: 20, default: 'Draft' })
  status: 'Draft' | 'Active' | 'Expired';

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;
}
