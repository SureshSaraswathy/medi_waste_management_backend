import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { NotificationReceiverEntity } from './notification-receiver.entity';

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  APPROVAL = 'APPROVAL',
  ALERT = 'ALERT',
}

@Entity('notifications')
@Index(['module', 'createdAt'])
@Index(['createdAt'])
export class NotificationEntity {
  @PrimaryColumn({ type: 'uuid', name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string;

  @Column({ type: 'text', name: 'message' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'type',
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 100, name: 'module' })
  module: string;

  @Column({ type: 'uuid', name: 'reference_id', nullable: true })
  referenceId: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @OneToMany(
    () => NotificationReceiverEntity,
    (receiver) => receiver.notification,
    { cascade: true },
  )
  receivers: NotificationReceiverEntity[];
}
