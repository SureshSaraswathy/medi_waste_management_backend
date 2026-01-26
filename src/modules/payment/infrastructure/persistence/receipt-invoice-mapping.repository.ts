import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptInvoiceMappingEntity } from '../transaction/receipt-invoice-mapping.entity';
import { ReceiptInvoiceMapping } from '../../domain/entities/receipt-invoice-mapping.domain.entity';
import { IReceiptInvoiceMappingRepository, RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class ReceiptInvoiceMappingRepository implements IReceiptInvoiceMappingRepository {
  constructor(
    @InjectRepository(ReceiptInvoiceMappingEntity, 'transaction')
    private readonly repository: Repository<ReceiptInvoiceMappingEntity>,
  ) {}

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return value;
  }

  private toDomain(entity: ReceiptInvoiceMappingEntity): ReceiptInvoiceMapping {
    return ReceiptInvoiceMapping.reconstitute({
      mappingId: entity.mappingId,
      receiptId: entity.receiptId,
      invoiceId: entity.invoiceId,
      allocatedAmount: Number(entity.allocatedAmount),
      createdBy: entity.createdBy,
      createdOn: this.toDate(entity.createdOn),
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: ReceiptInvoiceMapping): ReceiptInvoiceMappingEntity {
    const entity = new ReceiptInvoiceMappingEntity();
    entity.mappingId = domain.mappingId;
    entity.receiptId = domain.receiptId;
    entity.invoiceId = domain.invoiceId;
    entity.allocatedAmount = domain.allocatedAmount;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(mapping: ReceiptInvoiceMapping): Promise<ReceiptInvoiceMapping> {
    const entity = this.toEntity(mapping);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByReceipt(receiptId: string): Promise<ReceiptInvoiceMapping[]> {
    const entities = await this.repository.find({
      where: { receiptId, isDeleted: false },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByInvoice(invoiceId: string): Promise<ReceiptInvoiceMapping[]> {
    const entities = await this.repository.find({
      where: { invoiceId, isDeleted: false },
    });
    return entities.map(e => this.toDomain(e));
  }

  async deleteByReceipt(receiptId: string): Promise<void> {
    await this.repository.update(
      { receiptId, isDeleted: false },
      { isDeleted: true }
    );
  }
}
