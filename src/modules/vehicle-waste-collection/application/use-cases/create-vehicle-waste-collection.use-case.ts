import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { CreateVehicleWasteCollectionDto } from '../dto/create-vehicle-waste-collection.dto';
import { DuplicateVehicleCollectionException, InvalidWeightException } from '../../domain/exceptions/vehicle-waste-collection.exceptions';

@Injectable()
export class CreateVehicleWasteCollectionUseCase {
  constructor(
    @Inject(VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly vehicleWasteCollectionRepository: IVehicleWasteCollectionRepository,
  ) {}

  async execute(
    createDto: CreateVehicleWasteCollectionDto,
    createdBy?: string,
  ): Promise<VehicleWasteCollection> {
    // Validate gross weight >= net weight
    const netWeight = createDto.netWeightKg;
    if (createDto.grossWeightKg < netWeight) {
      throw new InvalidWeightException(
        `Gross weight (${createDto.grossWeightKg}) must be greater than or equal to net weight (${netWeight}).`,
      );
    }

    // Check for duplicate vehicle entry on same date
    const collectionDate = new Date(createDto.collectionDate);
    const existing = await this.vehicleWasteCollectionRepository.findByVehicleAndDate(
      createDto.vehicleId,
      collectionDate,
    );
    if (existing) {
      throw new DuplicateVehicleCollectionException(
        createDto.vehicleId,
        createDto.collectionDate,
      );
    }

    const vehicleWasteCollection = VehicleWasteCollection.create({
      vehicleWasteCollectionId: randomUUID(),
      vehicleId: createDto.vehicleId,
      collectionDate,
      grossWeightKg: createDto.grossWeightKg,
      tareWeightKg: createDto.tareWeightKg,
      netWeightKg: createDto.netWeightKg,
      incinerationWeightKg: createDto.incinerationWeightKg,
      autoclaveWeightKg: createDto.autoclaveWeightKg,
      vehicleKm: createDto.vehicleKm,
      fuelUsageLiters: createDto.fuelUsageLiters,
      notes: createDto.notes,
      createdBy,
    });

    return this.vehicleWasteCollectionRepository.create(vehicleWasteCollection);
  }
}
