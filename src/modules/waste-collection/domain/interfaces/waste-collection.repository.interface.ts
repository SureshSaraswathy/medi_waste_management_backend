import { WasteCollection } from '../entities/waste-collection.domain.entity';

export const WASTE_COLLECTION_REPOSITORY_TOKEN = 'WASTE_COLLECTION_REPOSITORY';

export interface IWasteCollectionRepository {
  create(wasteCollection: WasteCollection): Promise<WasteCollection>;
  findById(wasteCollectionId: string): Promise<WasteCollection | null>;
  findAll(): Promise<WasteCollection[]>;
  findByBarcodeAndDate(barcode: string, date: Date): Promise<WasteCollection | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<WasteCollection[]>;
  findByDate(date: Date): Promise<WasteCollection[]>;
  findByHcf(hcfId: string, startDate?: Date, endDate?: Date): Promise<WasteCollection[]>;
  findByCompany(companyId: string, startDate?: Date, endDate?: Date): Promise<WasteCollection[]>;
  findByStatus(status: string): Promise<WasteCollection[]>;
  findByRouteAssignment(routeAssignmentId: string): Promise<WasteCollection[]>;
  update(wasteCollectionId: string, wasteCollection: WasteCollection): Promise<WasteCollection>;
  softDelete(wasteCollectionId: string): Promise<void>;
}
