import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * TypeORM Entity - Infrastructure layer
 * Permissions Master Data
 */
@Entity('permissions')
@Index(['moduleName'])
@Index(['permissionCode'], { unique: true })
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  permissionId: string;

  @Column({ type: 'varchar', length: 100, name: 'permission_code', unique: true })
  permissionCode: string; // e.g., 'USER_CREATE', 'USER_VIEW'

  @Column({ type: 'varchar', length: 200, name: 'permission_name' })
  permissionName: string;

  @Column({ type: 'varchar', length: 100, name: 'module_name' })
  moduleName: string; // 'User Management', 'Roles & Permissions', etc.

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;
}
