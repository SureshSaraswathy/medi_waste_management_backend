import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('placeholder_master')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['placeholderCode'], { unique: true, where: 'is_deleted = false' })
export class PlaceholderMasterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'placeholder_id' })
  placeholderId: string;

  @Column({ type: 'varchar', length: 50, name: 'placeholder_code' })
  placeholderCode: string;

  @Column({ type: 'varchar', length: 200, name: 'placeholder_description' })
  placeholderDescription: string;

  @Column({ type: 'varchar', length: 100, name: 'source_table' })
  sourceTable: string;

  @Column({ type: 'varchar', length: 100, name: 'source_column' })
  sourceColumn: string;

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
