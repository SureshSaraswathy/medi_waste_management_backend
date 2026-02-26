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

  // Contact Information
  @Column({ type: 'varchar', length: 15, name: 'contact_num', nullable: true })
  contactNum?: string | null;

  @Column({ type: 'varchar', length: 500, name: 'web_address', nullable: true })
  webAddress?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'company_email', nullable: true })
  companyEmail?: string | null;

  // Bank & Payment Information
  @Column({ type: 'varchar', length: 200, name: 'bank_account_name', nullable: true })
  bankAccountName?: string | null;

  @Column({ type: 'varchar', length: 200, name: 'bank_name', nullable: true })
  bankName?: string | null;

  @Column({ type: 'varchar', length: 50, name: 'bank_account_num', nullable: true })
  bankAccountNum?: string | null;

  @Column({ type: 'varchar', length: 11, name: 'bank_ifsc_code', nullable: true })
  bankIFSCode?: string | null;

  @Column({ type: 'varchar', length: 200, name: 'bank_branch', nullable: true })
  bankBranch?: string | null;

  @Column({ type: 'varchar', length: 100, name: 'upi_id', nullable: true })
  upiId?: string | null;

  @Column({ type: 'text', name: 'qr_code', nullable: true })
  qrCode?: string | null;
}
