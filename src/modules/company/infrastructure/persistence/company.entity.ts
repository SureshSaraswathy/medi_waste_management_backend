import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CompanyStatus } from '../../domain/entities/company.domain.entity';

/**
 * TypeORM Entity - Infrastructure layer
 * Maps database schema to domain entity
 */
@Entity('companies')
@Index(['status'], { where: 'is_deleted = false' })
export class CompanyEntity {
  @PrimaryColumn({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 50, name: 'company_code', unique: true })
  companyCode: string;

  @Column({ type: 'varchar', length: 200, name: 'company_name' })
  companyName: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

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
