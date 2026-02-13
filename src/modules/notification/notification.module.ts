import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './presentation/notification.controller';
import { NotificationService } from './notification.service';
import { NotificationHelperService } from './notification-helper.service';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NotificationEntity } from './infrastructure/persistence/notification.entity';
import { NotificationReceiverEntity } from './infrastructure/persistence/notification-receiver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [NotificationEntity, NotificationReceiverEntity],
      'master',
    ),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationHelperService, NotificationRepository],
  exports: [NotificationService, NotificationHelperService, NotificationRepository],
})
export class NotificationModule {}
