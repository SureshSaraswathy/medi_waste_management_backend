import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoclaveRegisterController } from './presentation/autoclave-register.controller';
import { AutoclaveRegisterService } from './autoclave-register.service';
import { AutoclaveRegisterRepository } from './infrastructure/persistence/autoclave-register.repository';
import { AutoclaveRegisterEntity } from './infrastructure/transaction/autoclave-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutoclaveRegisterEntity], 'transaction'),
  ],
  controllers: [AutoclaveRegisterController],
  providers: [AutoclaveRegisterService, AutoclaveRegisterRepository],
  exports: [AutoclaveRegisterService],
})
export class AutoclaveRegisterModule {}
