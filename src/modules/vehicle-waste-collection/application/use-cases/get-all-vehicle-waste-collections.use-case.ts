import { Injectable, Inject } from '@nestjs/common';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { VehicleWasteCollectionStatus } from '../../infrastructure/transaction/vehicle-waste-collection.entity';

@Injectable()
export class GetAllVehicleWasteCollectionsUseCase {
  constructor(
    @Inject(VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly vehicleWasteCollectionRepository: IVehicleWasteCollectionRepository,
  ) {}

  async execute(
    vehicleId?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
  ): Promise<VehicleWasteCollection[]> {
    try {
      let results: VehicleWasteCollection[];

      // Start with base query based on filters
      if (startDate && endDate) {
        // Parse dates and ensure they're valid
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
        
        results = await this.vehicleWasteCollectionRepository.findByDateRange(start, end);
      } else if (vehicleId) {
        results = await this.vehicleWasteCollectionRepository.findByVehicle(vehicleId);
      } else {
        results = await this.vehicleWasteCollectionRepository.findAll();
      }

      // Apply status filter if provided (client-side filtering for now)
      if (status) {
        results = results.filter(t => t.status === (status as VehicleWasteCollectionStatus));
      }

      return results;
    } catch (error) {
      console.error('Error in GetAllVehicleWasteCollectionsUseCase:', error);
      throw error;
    }
  }
}
