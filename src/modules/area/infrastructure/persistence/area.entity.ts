import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('areas')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['areaCode'], { unique: true, where: 'is_deleted = false' })
export class AreaEntity {
  @PrimaryColumn({ type: 'uuid', name: 'area_id' })
  areaId: string;

  @Column({ type: 'varchar', length: 20, name: 'area_code' })
  areaCode: string;

  @Column({ type: 'varchar', length: 100, name: 'area_name' })
  areaName: string;

  @Column({ type: 'varchar', length: 6, name: 'area_pincode' })
  areaPincode: string;

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
