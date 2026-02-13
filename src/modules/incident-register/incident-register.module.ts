import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentRegisterController } from './presentation/incident-register.controller';
import { IncidentRegisterService } from './incident-register.service';
import { IncidentRegisterRepository } from './infrastructure/persistence/incident-register.repository';
import { IncidentRegisterEntity } from './infrastructure/transaction/incident-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncidentRegisterEntity], 'transaction'),
  ],
  controllers: [IncidentRegisterController],
  providers: [IncidentRegisterService, IncidentRegisterRepository],
  exports: [IncidentRegisterService],
})
export class IncidentRegisterModule {}
