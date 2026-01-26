import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptEntity } from '../transaction/receipt.entity';
import { Receipt } from '../../domain/entities/receipt.domain.entity';
import { IReceiptRepository, RECEIPT_REPOSITORY_TOKEN } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class ReceiptRepository implements IReceiptRepository {
  constructor(
    @InjectRepository(ReceiptEntity, 'transaction')
    private readonly repository: Repository<ReceiptEntity>,
  ) {}

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return value;
  }

  private toDomain(entity: ReceiptEntity): Receipt {
    // Note: financialYear and sequenceNumber are stored in entity but not in domain
    return Receipt.reconstitute({
      receiptId: entity.receiptId,
      companyId: entity.companyId,
      receiptNumber: entity.receiptNumber,
      receiptDate: this.toDate(entity.receiptDate),
      totalAmount: Number(entity.totalAmount),
      paymentId: entity.paymentId,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: this.toDate(entity.createdOn),
      modifiedBy: entity.modifiedBy,
      modifiedOn: this.toDate(entity.modifiedOn),
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: Receipt, financialYear?: string, sequenceNumber?: number): ReceiptEntity {
    const entity = new ReceiptEntity();
    entity.receiptId = domain.receiptId;
    entity.companyId = domain.companyId;
    entity.receiptNumber = domain.receiptNumber;
    entity.receiptDate = domain.receiptDate;
    entity.totalAmount = domain.totalAmount;
    entity.paymentId = domain.paymentId;
    entity.notes = domain.notes;
    // Extract financial year and sequence from receipt number if not provided
    if (financialYear) entity.financialYear = financialYear;
    if (sequenceNumber) entity.sequenceNumber = sequenceNumber;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.modifiedBy = domain.modifiedBy;
    entity.modifiedOn = domain.modifiedOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(receipt: Receipt, financialYear: string, sequenceNumber: number): Promise<Receipt> {
    const entity = this.toEntity(receipt, financialYear, sequenceNumber);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }


  async findById(receiptId: string): Promise<Receipt | null> {
    const entity = await this.repository.findOne({
      where: { receiptId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Receipt[]> {
    const entities = await this.repository.find({
      where: { companyId, isDeleted: false },
      order: { receiptDate: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByPayment(paymentId: string): Promise<Receipt | null> {
    const entity = await this.repository.findOne({
      where: { paymentId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<Receipt | null> {
    const entity = await this.repository.findOne({
      where: { receiptNumber, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findLastSequenceForFinancialYear(financialYear: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('receipt')
      .where('receipt.financial_year = :financialYear', { financialYear })
      .andWhere('receipt.is_deleted = :isDeleted', { isDeleted: false })
      .select('MAX(receipt.sequence_number)', 'maxSequence')
      .getRawOne();

    return result?.maxSequence || 0;
  }

  async update(receipt: Receipt): Promise<Receipt> {
    const entity = this.toEntity(receipt);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }
}
