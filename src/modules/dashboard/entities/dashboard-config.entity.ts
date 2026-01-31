import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Dashboard Configuration Entity
 * 
 * Stores dashboard widget and menu configurations for each role/department.
 * This is a configuration-only table and does not affect business logic.
 * 
 * Dashboard APIs are read-only and do not modify business logic.
 */
@Entity('dashboard_configs')
@Index(['role'], { unique: true })
export class DashboardConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @Column({ type: 'jsonb', nullable: true })
  widgets: any[];

  @Column({ type: 'jsonb', nullable: true })
  menuItems: any[];

  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, boolean>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
