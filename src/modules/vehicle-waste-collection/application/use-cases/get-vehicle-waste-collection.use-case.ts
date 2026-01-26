import { Injectable, Inject } from '@nestjs/common';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { VehicleWasteCollectionNotFoundException } from '../../domain/exceptions/vehicle-waste-collection.exceptions';

@Injectable()
export class GetVehicleWasteCollectionUseCase {
  constructor(
    @Inject(VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly vehicleWasteCollectionRepository: IVehicleWasteCollectionRepository,
  ) {}

  async execute(vehicleWasteCollectionId: string): Promise<VehicleWasteCollection> {
    const vehicleWasteCollection = await this.vehicleWasteCollectionRepository.findById(
      vehicleWasteCollectionId,
    );
    if (!vehicleWasteCollection) {
      throw new VehicleWasteCollectionNotFoundException(vehicleWasteCollectionId);
    }
    return vehicleWasteCollection;
  }
}
