import { InvoiceBatchEntity, BatchStatus } from '../../infrastructure/transaction/invoice-batch.entity';
import { InvoiceBatchItemEntity } from '../../infrastructure/transaction/invoice-batch-item.entity';

export const BATCH_REPOSITORY_TOKEN = 'BATCH_REPOSITORY';

export interface IBatchRepository {
  create(batch: InvoiceBatchEntity): Promise<InvoiceBatchEntity>;
  findById(id: string): Promise<InvoiceBatchEntity | null>;
  findAll(companyId?: string, status?: BatchStatus): Promise<InvoiceBatchEntity[]>;
  update(batch: InvoiceBatchEntity): Promise<InvoiceBatchEntity>;
  
  createItem(item: InvoiceBatchItemEntity): Promise<InvoiceBatchItemEntity>;
  findItemsByBatchId(batchId: string): Promise<InvoiceBatchItemEntity[]>;
  updateItem(item: InvoiceBatchItemEntity): Promise<InvoiceBatchItemEntity>;
  deleteItem(id: string): Promise<void>;
}
