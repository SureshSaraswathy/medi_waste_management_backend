import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NotificationEntity, NotificationType } from './infrastructure/persistence/notification.entity';
import { NotificationReceiverEntity, NotificationPriority } from './infrastructure/persistence/notification-receiver.entity';
import { CreateNotificationDto } from './application/dto/create-notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async createNotification(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notificationId = uuidv4();
    
    const notification: Partial<NotificationEntity> = {
      id: notificationId,
      title: dto.title,
      message: dto.message,
      type: dto.type || NotificationType.INFO,
      module: dto.module,
      referenceId: dto.referenceId || null,
      createdBy: dto.createdBy || null,
    };

    const savedNotification = await this.repository.create(notification);

    // Create receivers
    const receivers: Partial<NotificationReceiverEntity>[] = [];
    const priority = dto.priority || NotificationPriority.MEDIUM;

    if (dto.users && dto.users.length > 0) {
      for (const userId of dto.users) {
        receivers.push({
          id: uuidv4(),
          notificationId,
          userId,
          roleId: null,
          isRead: false,
          priority,
        });
      }
    }

    if (dto.roles && dto.roles.length > 0) {
      for (const roleId of dto.roles) {
        receivers.push({
          id: uuidv4(),
          notificationId,
          userId: null,
          roleId,
          isRead: false,
          priority,
        });
      }
    }

    if (receivers.length > 0) {
      await this.repository.createReceivers(receivers);
    }

    return savedNotification;
  }

  async getMyNotifications(userId: string, limit?: number): Promise<NotificationEntity[]> {
    return this.repository.findByUserId(userId, limit);
  }

  async getUnreadNotifications(userId: string): Promise<NotificationEntity[]> {
    return this.repository.findUnreadByUserId(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnreadByUserId(userId);
  }

  async markAsRead(receiverId: string): Promise<void> {
    await this.repository.markAsRead(receiverId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId);
  }
}
