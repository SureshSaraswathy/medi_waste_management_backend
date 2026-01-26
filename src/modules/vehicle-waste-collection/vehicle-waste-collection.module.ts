import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleWasteCollectionEntity } from './infrastructure/transaction/vehicle-waste-collection.entity';
import { VehicleWasteCollectionController } from './presentation/vehicle-waste-collection.controller';
import { VehicleWasteCollectionRepository } from './infrastructure/persistence/vehicle-waste-collection.repository';
import { VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from './domain/interfaces/vehicle-waste-collection.repository.interface';
import { CreateVehicleWasteCollectionUseCase } from './application/use-cases/create-vehicle-waste-collection.use-case';
import { GetVehicleWasteCollectionUseCase } from './application/use-cases/get-vehicle-waste-collection.use-case';
import { GetAllVehicleWasteCollectionsUseCase } from './application/use-cases/get-all-vehicle-waste-collections.use-case';
import { UpdateVehicleWasteCollectionUseCase } from './application/use-cases/update-vehicle-waste-collection.use-case';
import { SubmitVehicleWasteCollectionUseCase } from './application/use-cases/submit-vehicle-waste-collection.use-case';
import { VerifyVehicleWasteCollectionUseCase } from './application/use-cases/verify-vehicle-waste-collection.use-case';
import { DeleteVehicleWasteCollectionUseCase } from './application/use-cases/delete-vehicle-waste-collection.use-case';
import { FleetModule } from '../fleet/fleet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleWasteCollectionEntity], 'transaction'),
    FleetModule,
  ],
  controllers: [VehicleWasteCollectionController],
  providers: [
    {
      provide: VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN,
      useClass: VehicleWasteCollectionRepository,
    },
    CreateVehicleWasteCollectionUseCase,
    GetVehicleWasteCollectionUseCase,
    GetAllVehicleWasteCollectionsUseCase,
    UpdateVehicleWasteCollectionUseCase,
    SubmitVehicleWasteCollectionUseCase,
    VerifyVehicleWasteCollectionUseCase,
    DeleteVehicleWasteCollectionUseCase,
  ],
  exports: [],
})
export class VehicleWasteCollectionModule {}
