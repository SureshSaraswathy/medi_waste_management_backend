import { Injectable, Inject } from '@nestjs/common';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { VehicleWasteCollectionNotFoundException, InvalidStatusTransitionException } from '../../domain/exceptions/vehicle-waste-collection.exceptions';

@Injectable()
export class VerifyVehicleWasteCollectionUseCase {
  constructor(
    @Inject(VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly vehicleWasteCollectionRepository: IVehicleWasteCollectionRepository,
  ) {}

  async execute(
    vehicleWasteCollectionId: string,
    verifiedBy: string,
  ): Promise<VehicleWasteCollection> {
    const vehicleWasteCollection = await this.vehicleWasteCollectionRepository.findById(
      vehicleWasteCollectionId,
    );
    if (!vehicleWasteCollection) {
      throw new VehicleWasteCollectionNotFoundException(vehicleWasteCollectionId);
    }

    const verified = vehicleWasteCollection.verify(verifiedBy);
    return this.vehicleWasteCollectionRepository.update(verified);
  }
}
