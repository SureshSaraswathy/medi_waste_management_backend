import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('hcfs')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['hcfCode', 'companyId'], { unique: true, where: 'is_deleted = false' })
export class HcfEntity {
  @PrimaryColumn({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'varchar', length: 50, name: 'hcf_code' })
  hcfCode: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 255, name: 'password', nullable: true })
  password: string | null;

  // Authentication fields
  @Column({ type: 'boolean', name: 'login_enabled', default: false })
  loginEnabled: boolean;

  @Column({ type: 'varchar', length: 255, name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'boolean', name: 'force_password_change', default: false })
  forcePasswordChange: boolean;

  @Column({ type: 'varchar', length: 255, name: 'temporary_password', nullable: true })
  temporaryPassword: string | null;

  @Column({ type: 'timestamp', name: 'temporary_password_expiry', nullable: true })
  temporaryPasswordExpiry: Date | null;

  @Column({ type: 'timestamp', name: 'password_changed_at', nullable: true })
  passwordChangedAt: Date | null;

  @Column({ type: 'timestamp', name: 'password_expires_at', nullable: true })
  passwordExpiresAt: Date | null;

  @Column({ type: 'timestamp', name: 'last_login', nullable: true })
  lastLogin: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'reset_token', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', name: 'reset_token_expiry', nullable: true })
  resetTokenExpiry: Date | null;

  @Column({ type: 'varchar', length: 50, name: 'hcf_type_code', nullable: true })
  hcfTypeCode: string | null;

  @Column({ type: 'varchar', length: 200, name: 'hcf_name' })
  hcfName: string;

  @Column({ type: 'varchar', length: 100, name: 'hcf_short_name', nullable: true })
  hcfShortName: string | null;

  @Column({ type: 'uuid', name: 'area_id', nullable: true })
  areaId: string | null;

  @Column({ type: 'varchar', length: 10, name: 'pincode', nullable: true })
  pincode: string | null;

  @Column({ type: 'varchar', length: 100, name: 'district', nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 50, name: 'state_code', nullable: true })
  stateCode: string | null;

  @Column({ type: 'varchar', length: 50, name: 'group_code', nullable: true })
  groupCode: string | null;

  @Column({ type: 'uuid', name: 'pcb_zone', nullable: true })
  pcbZone: string | null;

  @Column({ type: 'varchar', length: 200, name: 'billing_name', nullable: true })
  billingName: string | null;

  @Column({ type: 'text', name: 'billing_address', nullable: true })
  billingAddress: string | null;

  @Column({ type: 'text', name: 'service_address', nullable: true })
  serviceAddress: string | null;

  @Column({ type: 'varchar', length: 20, name: 'gstin', nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 50, name: 'regn_num', nullable: true })
  regnNum: string | null;

  @Column({ type: 'varchar', length: 50, name: 'hosp_regn_date', nullable: true })
  hospRegnDate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'billing_type', nullable: true })
  billingType: string | null;

  @Column({ type: 'varchar', length: 50, name: 'adv_amount', nullable: true })
  advAmount: string | null;

  @Column({ type: 'varchar', length: 50, name: 'billing_option', nullable: true })
  billingOption: string | null;

  @Column({ type: 'varchar', length: 50, name: 'bed_count', nullable: true })
  bedCount: string | null;

  @Column({ type: 'varchar', length: 50, name: 'bed_rate', nullable: true })
  bedRate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'kg_rate', nullable: true })
  kgRate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'lumpsum', nullable: true })
  lumpsum: string | null;

  @Column({ type: 'varchar', length: 20, name: 'accounts_landline', nullable: true })
  accountsLandline: string | null;

  @Column({ type: 'varchar', length: 20, name: 'accounts_mobile', nullable: true })
  accountsMobile: string | null;

  @Column({ type: 'varchar', length: 100, name: 'accounts_email', nullable: true })
  accountsEmail: string | null;

  @Column({ type: 'varchar', length: 100, name: 'contact_name', nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 100, name: 'contact_designation', nullable: true })
  contactDesignation: string | null;

  @Column({ type: 'varchar', length: 20, name: 'contact_mobile', nullable: true })
  contactMobile: string | null;

  @Column({ type: 'varchar', length: 100, name: 'contact_email', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 100, name: 'agr_sign_auth_name', nullable: true })
  agrSignAuthName: string | null;

  @Column({ type: 'varchar', length: 100, name: 'agr_sign_auth_designation', nullable: true })
  agrSignAuthDesignation: string | null;

  @Column({ type: 'varchar', length: 100, name: 'dr_name', nullable: true })
  drName: string | null;

  @Column({ type: 'varchar', length: 20, name: 'dr_ph_no', nullable: true })
  drPhNo: string | null;

  @Column({ type: 'varchar', length: 100, name: 'dr_email', nullable: true })
  drEmail: string | null;

  @Column({ type: 'varchar', length: 50, name: 'service_start_date', nullable: true })
  serviceStartDate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'service_end_date', nullable: true })
  serviceEndDate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'category', nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 50, name: 'route', nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 100, name: 'executive_assigned', nullable: true })
  executiveAssigned: string | null;

  @Column({ type: 'varchar', length: 100, name: 'submit_by', nullable: true })
  submitBy: string | null;

  @Column({ type: 'varchar', length: 50, name: 'agr_id', nullable: true })
  agrID: string | null;

  @Column({ type: 'varchar', length: 10, name: 'sort_order', nullable: true })
  sortOrder: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_govt' })
  isGovt: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_gst_exempt' })
  isGSTExempt: boolean;

  @Column({ type: 'boolean', default: false, name: 'auto_gen' })
  autoGen: boolean;

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
