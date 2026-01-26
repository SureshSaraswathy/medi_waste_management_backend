import { VehicleWasteCollection } from '../entities/vehicle-waste-collection.domain.entity';
import { VehicleWasteCollectionStatus } from '../../infrastructure/transaction/vehicle-waste-collection.entity';

export const VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN = 'VEHICLE_WASTE_COLLECTION_REPOSITORY';

export interface IVehicleWasteCollectionRepository {
  create(vehicleWasteCollection: VehicleWasteCollection): Promise<VehicleWasteCollection>;
  findById(vehicleWasteCollectionId: string): Promise<VehicleWasteCollection | null>;
  findAll(): Promise<VehicleWasteCollection[]>;
  findByVehicle(vehicleId: string): Promise<VehicleWasteCollection[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<VehicleWasteCollection[]>;
  findByStatus(status: VehicleWasteCollectionStatus): Promise<VehicleWasteCollection[]>;
  findByVehicleAndDate(vehicleId: string, collectionDate: Date): Promise<VehicleWasteCollection | null>;
  update(vehicleWasteCollection: VehicleWasteCollection): Promise<VehicleWasteCollection>;
  softDelete(vehicleWasteCollectionId: string): Promise<void>;
}
