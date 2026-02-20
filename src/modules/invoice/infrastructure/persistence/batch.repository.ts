import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceBatchEntity, BatchStatus } from '../transaction/invoice-batch.entity';
import { InvoiceBatchItemEntity } from '../transaction/invoice-batch-item.entity';
import { IBatchRepository } from '../../domain/interfaces/batch.repository.interface';

@Injectable()
export class BatchRepository implements IBatchRepository {
  constructor(
    @InjectRepository(InvoiceBatchEntity, 'transaction')
    private readonly batchRepository: Repository<InvoiceBatchEntity>,
    @InjectRepository(InvoiceBatchItemEntity, 'transaction')
    private readonly itemRepository: Repository<InvoiceBatchItemEntity>,
  ) {}

  async create(batch: InvoiceBatchEntity): Promise<InvoiceBatchEntity> {
    return await this.batchRepository.save(batch);
  }

  async findById(id: string): Promise<InvoiceBatchEntity | null> {
    return await this.batchRepository.findOne({ where: { id } });
  }

  async findAll(companyId?: string, status?: BatchStatus): Promise<InvoiceBatchEntity[]> {
    const queryBuilder = this.batchRepository.createQueryBuilder('batch');
    
    if (companyId) {
      queryBuilder.where('batch.companyId = :companyId', { companyId });
    }
    
    if (status) {
      queryBuilder.andWhere('batch.status = :status', { status });
    }
    
    queryBuilder.orderBy('batch.createdAt', 'DESC');
    
    return await queryBuilder.getMany();
  }

  async update(batch: InvoiceBatchEntity): Promise<InvoiceBatchEntity> {
    return await this.batchRepository.save(batch);
  }

  async createItem(item: InvoiceBatchItemEntity): Promise<InvoiceBatchItemEntity> {
    return await this.itemRepository.save(item);
  }

  async findItemsByBatchId(batchId: string): Promise<InvoiceBatchItemEntity[]> {
    return await this.itemRepository.find({
      where: { batchId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateItem(item: InvoiceBatchItemEntity): Promise<InvoiceBatchItemEntity> {
    return await this.itemRepository.save(item);
  }

  async deleteItem(id: string): Promise<void> {
    await this.itemRepository.delete(id);
  }
}
