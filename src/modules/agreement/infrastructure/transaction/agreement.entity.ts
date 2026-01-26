import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('agreements')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['agreementNum', 'contractId'], { unique: true, where: 'is_deleted = false' })
@Index(['contractId'], { where: 'is_deleted = false' })
export class AgreementEntity {
  @PrimaryColumn({ type: 'uuid', name: 'agreement_id' })
  agreementId: string;

  @Column({ type: 'varchar', length: 100, name: 'agreement_id_display' })
  agreementID: string;

  @Column({ type: 'varchar', length: 200, name: 'agreement_num' })
  agreementNum: string;

  @Column({ type: 'uuid', name: 'contract_id' })
  contractId: string;

  @Column({ type: 'date', name: 'agreement_date' })
  agreementDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'Draft' })
  status: 'Draft' | 'Generated' | 'Signed';

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
