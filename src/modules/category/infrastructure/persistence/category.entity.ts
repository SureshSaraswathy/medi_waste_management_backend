import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Entity('categories')
@Index(['status'], { where: 'is_deleted = false' })
@Index(['categoryCode', 'companyId'], { unique: true, where: 'is_deleted = false' })
@Index(['categoryName', 'companyId'], { unique: true, where: 'is_deleted = false' })
export class CategoryEntity {
  @PrimaryColumn({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 50, name: 'category_code' })
  categoryCode: string;

  @Column({ type: 'varchar', length: 100, name: 'category_name' })
  categoryName: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

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
