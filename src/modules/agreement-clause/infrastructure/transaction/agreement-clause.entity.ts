import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('agreement_clauses')
@Index(['agreementTemplateId', 'pointNum'], { unique: true, where: 'is_deleted = false' })
@Index(['agreementTemplateId', 'sequenceNo'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
export class AgreementClauseEntity {
  @PrimaryColumn({ type: 'uuid', name: 'clause_id' })
  clauseId: string;

  @Column({ type: 'varchar', length: 100, name: 'agreement_clause_id_display' })
  agreementClauseID: string;

  @Column({ type: 'uuid', name: 'agreement_template_id' })
  agreementTemplateId: string;

  @Column({ type: 'varchar', length: 50, name: 'point_num' })
  pointNum: string;

  @Column({ type: 'varchar', length: 200, name: 'point_title' })
  pointTitle: string;

  @Column({ type: 'text', name: 'point_text' })
  pointText: string;

  @Column({ type: 'integer', name: 'sequence_no' })
  sequenceNo: number;

  @Column({ type: 'varchar', length: 20, default: 'Active' })
  status: 'Active' | 'Inactive';

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
