import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('states')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['stateCode'], { unique: true, where: 'is_deleted = false' })
export class StateEntity {
  @PrimaryColumn({ type: 'uuid', name: 'state_id' })
  stateId: string;

  @Column({ type: 'varchar', length: 10, name: 'state_code' })
  stateCode: string;

  @Column({ type: 'varchar', length: 100, name: 'state_name' })
  stateName: string;

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
