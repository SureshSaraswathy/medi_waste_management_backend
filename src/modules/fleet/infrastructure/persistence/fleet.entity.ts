import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('fleets')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['vehicleNum', 'companyId'], { unique: true, where: 'is_deleted = false' })
export class FleetEntity {
  @PrimaryColumn({ type: 'uuid', name: 'fleet_id' })
  fleetId: string;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_num' })
  vehicleNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 50, name: 'capacity', nullable: true })
  capacity: string | null;

  @Column({ type: 'varchar', length: 100, name: 'veh_make', nullable: true })
  vehMake: string | null;

  @Column({ type: 'varchar', length: 100, name: 'veh_model', nullable: true })
  vehModel: string | null;

  @Column({ type: 'varchar', length: 10, name: 'mfg_year', nullable: true })
  mfgYear: string | null;

  @Column({ type: 'varchar', length: 50, name: 'next_fc_date', nullable: true })
  nextFCDate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'puc_date_valid_upto', nullable: true })
  pucDateValidUpto: string | null;

  @Column({ type: 'varchar', length: 50, name: 'insurance_valid_upto', nullable: true })
  insuranceValidUpto: string | null;

  @Column({ type: 'varchar', length: 100, name: 'owner_name', nullable: true })
  ownerName: string | null;

  @Column({ type: 'varchar', length: 20, name: 'owner_contact', nullable: true })
  ownerContact: string | null;

  @Column({ type: 'varchar', length: 100, name: 'owner_email', nullable: true })
  ownerEmail: string | null;

  @Column({ type: 'varchar', length: 20, name: 'owner_pan', nullable: true })
  ownerPAN: string | null;

  @Column({ type: 'varchar', length: 20, name: 'owner_aadhaar', nullable: true })
  ownerAadhaar: string | null;

  @Column({ type: 'varchar', length: 100, name: 'pymt_to_name', nullable: true })
  pymtToName: string | null;

  @Column({ type: 'varchar', length: 100, name: 'pymt_bank_name', nullable: true })
  pymtBankName: string | null;

  @Column({ type: 'varchar', length: 50, name: 'pymt_acc_num', nullable: true })
  pymtAccNum: string | null;

  @Column({ type: 'varchar', length: 20, name: 'pymt_ifsc_code', nullable: true })
  pymtIFSCode: string | null;

  @Column({ type: 'varchar', length: 100, name: 'pymt_branch', nullable: true })
  pymtBranch: string | null;

  @Column({ type: 'varchar', length: 50, name: 'contract_amount', nullable: true })
  contractAmount: string | null;

  @Column({ type: 'boolean', default: false, name: 'tds_exemption' })
  tdsExemption: boolean;

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
