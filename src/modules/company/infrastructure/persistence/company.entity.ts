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

  @Column({ type: 'varchar', length: 15, name: 'gstin', nullable: true })
  gstin?: string | null;

  @Column({ type: 'varchar', length: 10, name: 'pincode', nullable: true })
  pincode?: string | null;

  @Column({ type: 'varchar', length: 10, name: 'state', nullable: true })
  state?: string | null;

  @Column({ type: 'varchar', length: 20, name: 'prefix', nullable: true })
  prefix?: string | null;

  // Address Information
  @Column({ type: 'text', name: 'regd_office_address', nullable: true })
  regdOfficeAddress?: string | null;

  @Column({ type: 'text', name: 'admin_office_address', nullable: true })
  adminOfficeAddress?: string | null;

  @Column({ type: 'text', name: 'factory_address', nullable: true })
  factoryAddress?: string | null;

  // Authorized Person Information
  @Column({ type: 'varchar', length: 200, name: 'auth_person_name', nullable: true })
  authPersonName?: string | null;

  @Column({ type: 'varchar', length: 200, name: 'auth_person_designation', nullable: true })
  authPersonDesignation?: string | null;

  @Column({ type: 'date', name: 'auth_person_dob', nullable: true })
  authPersonDOB?: Date | null;

  // PCB & Compliance
  @Column({ type: 'varchar', length: 100, name: 'pcb_auth_num', nullable: true })
  pcbauthNum?: string | null;

  @Column({ type: 'varchar', length: 100, name: 'hazardous_waste_num', nullable: true })
  hazardousWasteNum?: string | null;

  // CTO (Consent To Operate) - Water
  @Column({ type: 'varchar', length: 100, name: 'cto_water_num', nullable: true })
  ctoWaterNum?: string | null;

  @Column({ type: 'date', name: 'cto_water_date', nullable: true })
  ctoWaterDate?: Date | null;

  @Column({ type: 'date', name: 'cto_water_valid_upto', nullable: true })
  ctoWaterValidUpto?: Date | null;

  // CTO (Consent To Operate) - Air
  @Column({ type: 'varchar', length: 100, name: 'cto_air_num', nullable: true })
  ctoAirNum?: string | null;

  @Column({ type: 'date', name: 'cto_air_date', nullable: true })
  ctoAirDate?: Date | null;

  @Column({ type: 'date', name: 'cto_air_valid_upto', nullable: true })
  ctoAirValidUpto?: Date | null;

  // CTE (Consent To Establish) - Water
  @Column({ type: 'varchar', length: 100, name: 'cte_water_num', nullable: true })
  cteWaterNum?: string | null;

  @Column({ type: 'date', name: 'cte_water_date', nullable: true })
  cteWaterDate?: Date | null;

  @Column({ type: 'date', name: 'cte_water_valid_upto', nullable: true })
  cteWaterValidUpto?: Date | null;

  // CTE (Consent To Establish) - Air
  @Column({ type: 'varchar', length: 100, name: 'cte_air_num', nullable: true })
  cteAirNum?: string | null;

  @Column({ type: 'date', name: 'cte_air_date', nullable: true })
  cteAirDate?: Date | null;

  @Column({ type: 'date', name: 'cte_air_valid_upto', nullable: true })
  cteAirValidUpto?: Date | null;

  // GST Details
  @Column({ type: 'varchar', length: 50, name: 'pcb_zone_id', nullable: true })
  pcbZoneID?: string | null;

  @Column({ type: 'date', name: 'gst_valid_from', nullable: true })
  gstValidFrom?: Date | null;

  @Column({ type: 'varchar', length: 20, name: 'gst_rate', nullable: true })
  gstRate?: string | null;

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
