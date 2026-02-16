import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationReceiverEntity } from './notification-receiver.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity, 'master')
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationReceiverEntity, 'master')
    private readonly receiverRepo: Repository<NotificationReceiverEntity>,
  ) {}

  async create(notification: Partial<NotificationEntity>): Promise<NotificationEntity> {
    return this.notificationRepo.save(notification);
  }

  async createReceivers(receivers: Partial<NotificationReceiverEntity>[]): Promise<void> {
    await this.receiverRepo.save(receivers);
  }

  async findByUserId(
    userId: string,
    limit?: number,
  ): Promise<NotificationEntity[]> {
    // Query notifications where user is a direct receiver OR has a role that receives the notification
    // Users table has user_role_id column (not a junction table)
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.receivers', 'receiver')
      .where('receiver.userId = :userId', { userId })
      .orWhere('receiver.roleId IN (SELECT u.user_role_id FROM users u WHERE u.user_id = :userId AND u.user_role_id IS NOT NULL)', { userId })
      .orderBy('receiver.priority', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC')
      .distinct(true);

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  async findUnreadByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.receivers', 'receiver')
      .where('receiver.isRead = false')
      .andWhere('(receiver.userId = :userId OR receiver.roleId IN (SELECT u.user_role_id FROM users u WHERE u.user_id = :userId AND u.user_role_id IS NOT NULL))', { userId })
      .orderBy('receiver.priority', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC')
      .distinct(true)
      .getMany();
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    // Count unique notifications (not receivers) for this user
    const result = await this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoin('notification.receivers', 'receiver')
      .where('receiver.isRead = false')
      .andWhere('(receiver.userId = :userId OR receiver.roleId IN (SELECT u.user_role_id FROM users u WHERE u.user_id = :userId AND u.user_role_id IS NOT NULL))', { userId })
      .select('COUNT(DISTINCT notification.id)', 'count')
      .getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  async markAsRead(receiverId: string): Promise<void> {
    await this.receiverRepo.update(receiverId, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    // Mark all receivers as read for this user (direct or via roles)
    await this.receiverRepo
      .createQueryBuilder()
      .update(NotificationReceiverEntity)
      .set({
        isRead: true,
        readAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('isRead = false')
      .andWhere('(userId = :userId OR roleId IN (SELECT u.user_role_id FROM users u WHERE u.user_id = :userId AND u.user_role_id IS NOT NULL))', { userId })
      .execute();
  }

  async findByRoleIds(
    roleIds: string[],
    limit?: number,
  ): Promise<NotificationEntity[]> {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.receivers', 'receiver')
      .where('receiver.roleId IN (:...roleIds)', { roleIds })
      .orderBy('receiver.priority', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }
}
