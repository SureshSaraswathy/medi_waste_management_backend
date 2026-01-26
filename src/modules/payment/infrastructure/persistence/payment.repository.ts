import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../transaction/payment.entity';
import { PaymentStatus, PaymentMode } from '../../domain/entities/payment.domain.entity';
import { Payment } from '../../domain/entities/payment.domain.entity';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity, 'transaction')
    private readonly repository: Repository<PaymentEntity>,
  ) {}

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return value;
  }

  private toDomain(entity: PaymentEntity): Payment {
    return Payment.reconstitute({
      paymentId: entity.paymentId,
      companyId: entity.companyId,
      paymentDate: this.toDate(entity.paymentDate),
      paymentAmount: Number(entity.paymentAmount),
      paymentMode: entity.paymentMode,
      referenceNumber: entity.referenceNumber,
      bankName: entity.bankName,
      chequeNumber: entity.chequeNumber,
      chequeDate: entity.chequeDate ? this.toDate(entity.chequeDate) : null,
      status: entity.status,
      notes: entity.notes,
      receiptId: entity.receiptId,
      createdBy: entity.createdBy,
      createdOn: this.toDate(entity.createdOn),
      modifiedBy: entity.modifiedBy,
      modifiedOn: this.toDate(entity.modifiedOn),
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.paymentId = domain.paymentId;
    entity.companyId = domain.companyId;
    entity.paymentDate = domain.paymentDate;
    entity.paymentAmount = domain.paymentAmount;
    entity.paymentMode = domain.paymentMode;
    entity.referenceNumber = domain.referenceNumber;
    entity.bankName = domain.bankName;
    entity.chequeNumber = domain.chequeNumber;
    entity.chequeDate = domain.chequeDate;
    entity.status = domain.status;
    entity.notes = domain.notes;
    entity.receiptId = domain.receiptId;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.modifiedBy = domain.modifiedBy;
    entity.modifiedOn = domain.modifiedOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(paymentId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: { paymentId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Payment[]> {
    const entities = await this.repository.find({
      where: { companyId, isDeleted: false },
      order: { paymentDate: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByReceipt(receiptId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: { receiptId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findWithoutReceipt(companyId?: string): Promise<Payment[]> {
    const where: any = {
      receiptId: null, // Payments without receipts
      isDeleted: false,
      status: PaymentStatus.COMPLETED, // Only completed payments
    };
    
    if (companyId) {
      where.companyId = companyId;
    }

    const entities = await this.repository.find({
      where,
      order: { paymentDate: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async update(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }
}
