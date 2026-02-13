import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncinerationRegisterController } from './presentation/incineration-register.controller';
import { IncinerationRegisterService } from './incineration-register.service';
import { IncinerationRegisterRepository } from './infrastructure/persistence/incineration-register.repository';
import { IncinerationRegisterEntity } from './infrastructure/transaction/incineration-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncinerationRegisterEntity], 'transaction'),
  ],
  controllers: [IncinerationRegisterController],
  providers: [IncinerationRegisterService, IncinerationRegisterRepository],
  exports: [IncinerationRegisterService],
})
export class IncinerationRegisterModule {}
