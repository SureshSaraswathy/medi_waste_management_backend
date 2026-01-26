import { WasteProcess } from '../entities/waste-process.domain.entity';
import { WasteProcessStatus } from '../../infrastructure/transaction/waste-process.entity';

export const WASTE_PROCESS_REPOSITORY_TOKEN = 'WASTE_PROCESS_REPOSITORY';

export interface IWasteProcessRepository {
  create(wasteProcess: WasteProcess): Promise<WasteProcess>;
  findById(wasteProcessId: string): Promise<WasteProcess | null>;
  findAll(): Promise<WasteProcess[]>;
  findByCompany(companyId: string): Promise<WasteProcess[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<WasteProcess[]>;
  findByStatus(status: WasteProcessStatus): Promise<WasteProcess[]>;
  findByCompanyAndDate(companyId: string, processDate: Date): Promise<WasteProcess | null>;
  update(wasteProcess: WasteProcess): Promise<WasteProcess>;
  softDelete(wasteProcessId: string): Promise<void>;
}
