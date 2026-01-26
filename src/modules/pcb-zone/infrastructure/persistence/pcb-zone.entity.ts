import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('pcb_zones')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['pcbZoneName'], { unique: true, where: 'is_deleted = false' })
export class PcbZoneEntity {
  @PrimaryColumn({ type: 'uuid', name: 'pcb_zone_id' })
  pcbZoneId: string;

  @Column({ type: 'varchar', length: 100, name: 'pcb_zone_name' })
  pcbZoneName: string;

  @Column({ type: 'varchar', length: 255, name: 'pcb_zone_address', nullable: true })
  pcbZoneAddress: string | null;

  @Column({ type: 'varchar', length: 20, name: 'contact_num', nullable: true })
  contactNum: string | null;

  @Column({ type: 'varchar', length: 100, name: 'contact_email', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 100, name: 'alert_email', nullable: true })
  alertEmail: string | null;

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
