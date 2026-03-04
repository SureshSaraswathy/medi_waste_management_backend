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
import { StateEntity } from '../../../state/infrastructure/persistence/state.entity';

@Entity('districts')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['districtCode'], { unique: true, where: 'is_deleted = false' })
@Index(['stateId'], { where: 'is_deleted = false' })
export class DistrictEntity {
  @PrimaryColumn({ type: 'uuid', name: 'district_id' })
  districtId: string;

  @Column({ type: 'varchar', length: 10, name: 'district_code' })
  districtCode: string;

  @Column({ type: 'varchar', length: 100, name: 'district_name' })
  districtName: string;

  @Column({ type: 'uuid', name: 'state_id', nullable: true })
  stateId: string | null;

  @ManyToOne(() => StateEntity, { nullable: true })
  @JoinColumn({ name: 'state_id' })
  state?: StateEntity;

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
