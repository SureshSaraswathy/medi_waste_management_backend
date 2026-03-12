import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('agreement_templates')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['templateCode'], { unique: true, where: 'is_deleted = false' })
export class AgreementTemplateEntity {
  @PrimaryColumn({ type: 'uuid', name: 'template_id' })
  templateId: string;

  @Column({ type: 'varchar', length: 50, name: 'template_code' })
  templateCode: string;

  @Column({ type: 'varchar', length: 200, name: 'template_name' })
  templateName: string;

  @Column({ type: 'varchar', length: 100, name: 'agreement_category', nullable: true })
  agreementCategory: string | null;

  @Column({ type: 'text', name: 'template_description', nullable: true })
  templateDescription: string | null;

  @Column({ type: 'text', name: 'template_content', nullable: true })
  templateContent: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: MasterStatus.ACTIVE,
  })
  status: MasterStatus;

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
