import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAllocationEntity } from '../transaction/payment-allocation.entity';
import { PaymentAllocation } from '../../domain/entities/payment-allocation.domain.entity';
import { IPaymentAllocationRepository, PAYMENT_ALLOCATION_REPOSITORY_TOKEN } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class PaymentAllocationRepository implements IPaymentAllocationRepository {
  constructor(
    @InjectRepository(PaymentAllocationEntity, 'transaction')
    private readonly repository: Repository<PaymentAllocationEntity>,
  ) {}

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return value;
  }

  private toDomain(entity: PaymentAllocationEntity): PaymentAllocation {
    return PaymentAllocation.reconstitute({
      allocationId: entity.allocationId,
      paymentId: entity.paymentId,
      invoiceId: entity.invoiceId,
      allocatedAmount: Number(entity.allocatedAmount),
      allocationDate: this.toDate(entity.allocationDate),
      createdBy: entity.createdBy,
      createdOn: this.toDate(entity.createdOn),
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: PaymentAllocation): PaymentAllocationEntity {
    const entity = new PaymentAllocationEntity();
    entity.allocationId = domain.allocationId;
    entity.paymentId = domain.paymentId;
    entity.invoiceId = domain.invoiceId;
    entity.allocatedAmount = domain.allocatedAmount;
    entity.allocationDate = domain.allocationDate;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(allocation: PaymentAllocation): Promise<PaymentAllocation> {
    const entity = this.toEntity(allocation);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByPayment(paymentId: string): Promise<PaymentAllocation[]> {
    const entities = await this.repository.find({
      where: { paymentId, isDeleted: false },
      order: { allocationDate: 'ASC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByInvoice(invoiceId: string): Promise<PaymentAllocation[]> {
    const entities = await this.repository.find({
      where: { invoiceId, isDeleted: false },
      order: { allocationDate: 'ASC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async deleteByPayment(paymentId: string): Promise<void> {
    await this.repository.update(
      { paymentId, isDeleted: false },
      { isDeleted: true }
    );
  }
}
