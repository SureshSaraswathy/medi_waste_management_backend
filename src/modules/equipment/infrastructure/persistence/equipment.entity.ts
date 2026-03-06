import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';
import { CompanyEntity } from '../../../company/infrastructure/persistence/company.entity';

@Entity('equipment_master')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['equipmentCode'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId'], { where: 'is_deleted = false' })
export class EquipmentEntity {
  @PrimaryColumn({ type: 'uuid', name: 'equipment_id' })
  equipmentId: string;

  @Column({ type: 'uuid', name: 'company_id', nullable: false })
  companyId: string;

  @ManyToOne(() => CompanyEntity, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  @Column({ type: 'varchar', length: 20, name: 'equipment_code' })
  equipmentCode: string;

  @Column({ type: 'varchar', length: 50, name: 'equipment_name' })
  equipmentName: string;

  @Column({ type: 'varchar', length: 30, name: 'equipment_type', nullable: true })
  equipmentType: string | null;

  @Column({ type: 'varchar', length: 30, name: 'make', nullable: true })
  make: string | null;

  @Column({ type: 'varchar', length: 30, name: 'capacity', nullable: true })
  capacity: string | null;

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
