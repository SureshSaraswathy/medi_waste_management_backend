import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetController } from './presentation/fleet.controller';
import { FleetRepository } from './infrastructure/persistence/fleet.repository';
import { FleetEntity } from './infrastructure/persistence/fleet.entity';
import { CreateFleetUseCase } from './application/use-cases/create-fleet.use-case';
import { GetFleetUseCase } from './application/use-cases/get-fleet.use-case';
import { GetAllFleetsUseCase } from './application/use-cases/get-all-fleets.use-case';
import { UpdateFleetUseCase } from './application/use-cases/update-fleet.use-case';
import { DeleteFleetUseCase } from './application/use-cases/delete-fleet.use-case';
import { FLEET_REPOSITORY_TOKEN } from './domain/interfaces/fleet.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([FleetEntity], 'master')],
  controllers: [FleetController],
  providers: [
    {
      provide: FLEET_REPOSITORY_TOKEN,
      useClass: FleetRepository,
    },
    CreateFleetUseCase,
    GetFleetUseCase,
    GetAllFleetsUseCase,
    UpdateFleetUseCase,
    DeleteFleetUseCase,
  ],
  exports: [FLEET_REPOSITORY_TOKEN],
})
export class FleetModule {}
