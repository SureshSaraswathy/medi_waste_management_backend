import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('my')
  async getMyNotifications(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.notificationService.getMyNotifications(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return {
      count: await this.notificationService.getUnreadCount(userId),
    };
  }

  @Post('read/:id')
  async markAsRead(@Param('id') receiverId: string) {
    await this.notificationService.markAsRead(receiverId);
    return { success: true };
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }
}
