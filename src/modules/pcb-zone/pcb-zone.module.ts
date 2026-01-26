import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcbZoneController } from './presentation/pcb-zone.controller';
import { PcbZoneRepository } from './infrastructure/persistence/pcb-zone.repository';
import { PcbZoneEntity } from './infrastructure/persistence/pcb-zone.entity';
import { CreatePcbZoneUseCase } from './application/use-cases/create-pcb-zone.use-case';
import { GetPcbZoneUseCase } from './application/use-cases/get-pcb-zone.use-case';
import { GetAllPcbZonesUseCase } from './application/use-cases/get-all-pcb-zones.use-case';
import { UpdatePcbZoneUseCase } from './application/use-cases/update-pcb-zone.use-case';
import { DeletePcbZoneUseCase } from './application/use-cases/delete-pcb-zone.use-case';
import { PCB_ZONE_REPOSITORY_TOKEN } from './domain/interfaces/pcb-zone.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([PcbZoneEntity], 'master')],
  controllers: [PcbZoneController],
  providers: [
    {
      provide: PCB_ZONE_REPOSITORY_TOKEN,
      useClass: PcbZoneRepository,
    },
    CreatePcbZoneUseCase,
    GetPcbZoneUseCase,
    GetAllPcbZonesUseCase,
    UpdatePcbZoneUseCase,
    DeletePcbZoneUseCase,
  ],
  exports: [PCB_ZONE_REPOSITORY_TOKEN],
})
export class PcbZoneModule {}
