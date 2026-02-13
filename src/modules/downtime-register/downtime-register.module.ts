import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DowntimeRegisterController } from './presentation/downtime-register.controller';
import { DowntimeRegisterService } from './downtime-register.service';
import { DowntimeRegisterRepository } from './infrastructure/persistence/downtime-register.repository';
import { DowntimeRegisterEntity } from './infrastructure/transaction/downtime-register.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DowntimeRegisterEntity], 'transaction'),
    forwardRef(() => NotificationModule),
  ],
  controllers: [DowntimeRegisterController],
  providers: [DowntimeRegisterService, DowntimeRegisterRepository],
  exports: [DowntimeRegisterService],
})
export class DowntimeRegisterModule {}
