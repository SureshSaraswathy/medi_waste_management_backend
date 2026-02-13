import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionRegisterController } from './presentation/emission-register.controller';
import { EmissionRegisterService } from './emission-register.service';
import { EmissionRegisterRepository } from './infrastructure/persistence/emission-register.repository';
import { EmissionRegisterEntity } from './infrastructure/transaction/emission-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmissionRegisterEntity], 'transaction'),
  ],
  controllers: [EmissionRegisterController],
  providers: [EmissionRegisterService, EmissionRegisterRepository],
  exports: [EmissionRegisterService],
})
export class EmissionRegisterModule {}
