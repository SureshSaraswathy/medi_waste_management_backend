import { Injectable, Inject } from '@nestjs/common';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { UpdateVehicleWasteCollectionDto } from '../dto/update-vehicle-waste-collection.dto';
import { VehicleWasteCollectionNotFoundException, InvalidWeightException, InvalidStatusTransitionException } from '../../domain/exceptions/vehicle-waste-collection.exceptions';

@Injectable()
export class UpdateVehicleWasteCollectionUseCase {
  constructor(
    @Inject(VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly vehicleWasteCollectionRepository: IVehicleWasteCollectionRepository,
  ) {}

  async execute(
    vehicleWasteCollectionId: string,
    updateDto: UpdateVehicleWasteCollectionDto,
    modifiedBy?: string,
  ): Promise<VehicleWasteCollection> {
    const vehicleWasteCollection = await this.vehicleWasteCollectionRepository.findById(
      vehicleWasteCollectionId,
    );
    if (!vehicleWasteCollection) {
      throw new VehicleWasteCollectionNotFoundException(vehicleWasteCollectionId);
    }

    // Only draft collections can be updated
    if (vehicleWasteCollection.status !== 'Draft') {
      throw new InvalidStatusTransitionException(
        vehicleWasteCollection.status,
        'update',
      );
    }

    // Validate weights if provided
    const grossWeight = updateDto.grossWeightKg ?? vehicleWasteCollection.grossWeightKg;
    const netWeight = updateDto.netWeightKg ?? vehicleWasteCollection.netWeightKg;

    // Validate gross weight >= net weight
    if (grossWeight < netWeight) {
      throw new InvalidWeightException(
        `Gross weight (${grossWeight}) must be greater than or equal to net weight (${netWeight}).`,
      );
    }

    const updated = vehicleWasteCollection.update({
      grossWeightKg: updateDto.grossWeightKg,
      tareWeightKg: updateDto.tareWeightKg,
      netWeightKg: updateDto.netWeightKg,
      incinerationWeightKg: updateDto.incinerationWeightKg,
      autoclaveWeightKg: updateDto.autoclaveWeightKg,
      vehicleKm: updateDto.vehicleKm,
      fuelUsageLiters: updateDto.fuelUsageLiters,
      notes: updateDto.notes,
      modifiedBy,
    });

    return this.vehicleWasteCollectionRepository.update(updated);
  }
}
