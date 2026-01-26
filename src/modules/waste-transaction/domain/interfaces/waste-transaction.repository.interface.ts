import { WasteTransaction } from '../entities/waste-transaction.domain.entity';
import { TransactionStatus } from '../../infrastructure/transaction/waste-transaction.entity';

export const WASTE_TRANSACTION_REPOSITORY_TOKEN = 'WASTE_TRANSACTION_REPOSITORY';

export interface IWasteTransactionRepository {
  create(wasteTransaction: WasteTransaction): Promise<WasteTransaction>;
  findById(wasteTransactionId: string): Promise<WasteTransaction | null>;
  findAll(): Promise<WasteTransaction[]>;
  findByCompany(companyId: string): Promise<WasteTransaction[]>;
  findByHcf(hcfId: string): Promise<WasteTransaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<WasteTransaction[]>;
  findByStatus(status: TransactionStatus): Promise<WasteTransaction[]>;
  findByCompanyAndDate(companyId: string, pickupDate: Date): Promise<WasteTransaction[]>;
  findByHcfAndDate(hcfId: string, pickupDate: Date): Promise<WasteTransaction[]>;
  findVerifiedTransactionsByHcfAndDateRange(hcfId: string, startDate: Date, endDate: Date): Promise<WasteTransaction[]>;
  update(wasteTransaction: WasteTransaction): Promise<WasteTransaction>;
  softDelete(wasteTransactionId: string): Promise<void>;
}
