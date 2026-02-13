import { Injectable } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from './infrastructure/persistence/notification.entity';
import { NotificationPriority } from './infrastructure/persistence/notification-receiver.entity';

@Injectable()
export class NotificationHelperService {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Helper method to create notifications with role name resolution
   * Note: This is a simplified version. In production, you'd want to inject RoleRepository
   * to resolve role names to IDs. For now, we'll use role IDs directly.
   */
  async notifyRoles(
    title: string,
    message: string,
    module: string,
    roleIds: string[],
    options?: {
      referenceId?: string;
      type?: NotificationType;
      priority?: NotificationPriority;
      createdBy?: string;
    },
  ): Promise<void> {
    await this.notificationService.createNotification({
      title,
      message,
      module,
      roles: roleIds,
      referenceId: options?.referenceId,
      type: options?.type || NotificationType.INFO,
      priority: options?.priority || NotificationPriority.MEDIUM,
      createdBy: options?.createdBy,
    });
  }

  async notifyUsers(
    title: string,
    message: string,
    module: string,
    userIds: string[],
    options?: {
      referenceId?: string;
      type?: NotificationType;
      priority?: NotificationPriority;
      createdBy?: string;
    },
  ): Promise<void> {
    await this.notificationService.createNotification({
      title,
      message,
      module,
      users: userIds,
      referenceId: options?.referenceId,
      type: options?.type || NotificationType.INFO,
      priority: options?.priority || NotificationPriority.MEDIUM,
      createdBy: options?.createdBy,
    });
  }
}
