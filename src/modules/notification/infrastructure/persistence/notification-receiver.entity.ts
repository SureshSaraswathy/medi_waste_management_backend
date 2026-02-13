import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotificationEntity } from './notification.entity';

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('notification_receivers')
@Index(['userId', 'isRead'])
@Index(['roleId', 'isRead'])
@Index(['notificationId'])
export class NotificationReceiverEntity {
  @PrimaryColumn({ type: 'uuid', name: 'id' })
  id: string;

  @Column({ type: 'uuid', name: 'notification_id' })
  notificationId: string;

  @ManyToOne(() => NotificationEntity, (notification) => notification.receivers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'role_id', nullable: true })
  roleId: string | null;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  readAt: Date | null;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    name: 'priority',
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;
}
