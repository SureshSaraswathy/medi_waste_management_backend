import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ETPRegisterController } from './presentation/etp-register.controller';
import { ETPRegisterService } from './etp-register.service';
import { ETPRegisterRepository } from './infrastructure/persistence/etp-register.repository';
import { ETPRegisterEntity } from './infrastructure/transaction/etp-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ETPRegisterEntity], 'transaction'),
  ],
  controllers: [ETPRegisterController],
  providers: [ETPRegisterService, ETPRegisterRepository],
  exports: [ETPRegisterService],
})
export class ETPRegisterModule {}
