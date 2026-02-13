import { IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { NotificationType } from '../../infrastructure/persistence/notification.entity';
import { NotificationPriority } from '../../infrastructure/persistence/notification-receiver.entity';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  module: string;

  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  users?: string[];

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
