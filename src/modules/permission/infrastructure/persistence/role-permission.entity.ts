import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from '../../../role/infrastructure/persistence/role.entity';
import { PermissionEntity } from './permission.entity';

/**
 * TypeORM Entity - Infrastructure layer
 * Role-Permission Mapping
 */
@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
@Index(['roleId'])
@Index(['permissionId'])
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  rolePermissionId: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ type: 'uuid', name: 'permission_id' })
  permissionId: string;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;
}
