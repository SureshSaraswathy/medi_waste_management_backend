import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceStatus, BillingType, BillingOption, InvoiceGenerationType } from '../transaction/invoice.entity';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { IInvoiceRepository } from '../../domain/interfaces/invoice.repository.interface';
import { InvoiceNotFoundException } from '../../domain/exceptions/invoice.exceptions';

@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly repository: Repository<InvoiceEntity>,
  ) {}

  private toDomain(entity: InvoiceEntity): Invoice {
    // Helper function to ensure date is a Date object
    const toDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === 'string') return new Date(value);
      return value;
    };

    return new Invoice(
      entity.invoiceId,
      entity.companyId,
      entity.hcfId,
      entity.invoiceNumber,
      toDate(entity.invoiceDate),
      toDate(entity.dueDate),
      entity.billingType,
      entity.billingDays,
      entity.billingOption,
      entity.generationType,
      entity.bedCount,
      entity.bedRate,
      entity.weightInKg,
      entity.kgRate,
      entity.lumpsumAmount,
      Number(entity.taxableValue),
      Number(entity.igst),
      Number(entity.cgst),
      Number(entity.sgst),
      Number(entity.roundOff),
      Number(entity.invoiceValue),
      Number(entity.totalPaidAmount),
      Number(entity.balanceAmount),
      entity.status,
      entity.batchId,
      entity.postedAt ? toDate(entity.postedAt) : null,
      entity.isLocked,
      entity.lockedAfterDate ? toDate(entity.lockedAfterDate) : null,
      entity.financialYear,
      entity.sequenceNumber,
      entity.billingPeriodStart ? toDate(entity.billingPeriodStart) : null,
      entity.billingPeriodEnd ? toDate(entity.billingPeriodEnd) : null,
      entity.notes,
      entity.createdBy,
      toDate(entity.createdOn),
      entity.modifiedBy,
      toDate(entity.modifiedOn),
      entity.isDeleted,
    );
  }

  private toEntity(domain: Invoice): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.invoiceId = domain.invoiceId;
    entity.companyId = domain.companyId;
    entity.hcfId = domain.hcfId;
    entity.invoiceNumber = domain.invoiceNumber;
    entity.invoiceDate = domain.invoiceDate;
    entity.dueDate = domain.dueDate;
    entity.billingType = domain.billingType;
    entity.billingDays = domain.billingDays;
    entity.billingOption = domain.billingOption;
    entity.generationType = domain.generationType;
    entity.bedCount = domain.bedCount;
    entity.bedRate = domain.bedRate;
    entity.weightInKg = domain.weightInKg;
    entity.kgRate = domain.kgRate;
    entity.lumpsumAmount = domain.lumpsumAmount;
    entity.taxableValue = domain.taxableValue;
    entity.igst = domain.igst;
    entity.cgst = domain.cgst;
    entity.sgst = domain.sgst;
    entity.roundOff = domain.roundOff;
    entity.invoiceValue = domain.invoiceValue;
    entity.totalPaidAmount = domain.totalPaidAmount;
    entity.balanceAmount = domain.balanceAmount;
    entity.status = domain.status;
    entity.batchId = domain.batchId;
    entity.postedAt = domain.postedAt;
    entity.isLocked = domain.isLocked;
    entity.lockedAfterDate = domain.lockedAfterDate;
    entity.financialYear = domain.financialYear;
    entity.sequenceNumber = domain.sequenceNumber;
    entity.billingPeriodStart = domain.billingPeriodStart;
    entity.billingPeriodEnd = domain.billingPeriodEnd;
    entity.notes = domain.notes;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.modifiedBy = domain.modifiedBy;
    entity.modifiedOn = domain.modifiedOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(invoice: Invoice): Promise<Invoice> {
    const entity = this.toEntity(invoice);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const entity = this.toEntity(invoice);
    await this.repository.update(invoice.invoiceId, entity);
    const updated = await this.findById(invoice.invoiceId);
    if (!updated) {
      throw new InvoiceNotFoundException(invoice.invoiceId);
    }
    return updated;
  }

  async findById(invoiceId: string): Promise<Invoice | null> {
    const entity = await this.repository.findOne({
      where: { invoiceId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const entity = await this.repository.findOne({
      where: { invoiceNumber, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: {
    companyId?: string;
    hcfId?: string;
    status?: string;
    financialYear?: string;
    invoiceDateFrom?: Date;
    invoiceDateTo?: Date;
  }): Promise<Invoice[]> {
    const queryBuilder = this.repository.createQueryBuilder('invoice')
      .where('invoice.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.companyId) {
      queryBuilder.andWhere('invoice.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters?.hcfId) {
      queryBuilder.andWhere('invoice.hcfId = :hcfId', { hcfId: filters.hcfId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters?.financialYear) {
      queryBuilder.andWhere('invoice.financialYear = :financialYear', { financialYear: filters.financialYear });
    }

    if (filters?.invoiceDateFrom) {
      queryBuilder.andWhere('invoice.invoiceDate >= :invoiceDateFrom', { invoiceDateFrom: filters.invoiceDateFrom });
    }

    if (filters?.invoiceDateTo) {
      queryBuilder.andWhere('invoice.invoiceDate <= :invoiceDateTo', { invoiceDateTo: filters.invoiceDateTo });
    }

    queryBuilder.orderBy('invoice.invoiceDate', 'DESC')
      .addOrderBy('invoice.sequenceNumber', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findLastSequenceForFinancialYear(financialYear: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('invoice')
      .select('MAX(invoice.sequenceNumber)', 'maxSequence')
      .where('invoice.financialYear = :financialYear', { financialYear })
      .andWhere('invoice.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne();

    return result?.maxSequence ? parseInt(result.maxSequence, 10) : 0;
  }

  async findDuplicateInvoice(params: {
    companyId: string;
    hcfId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    billingType: string;
  }): Promise<Invoice | null> {
    const entity = await this.repository.findOne({
      where: {
        companyId: params.companyId,
        hcfId: params.hcfId,
        billingPeriodStart: params.billingPeriodStart,
        billingPeriodEnd: params.billingPeriodEnd,
        billingType: params.billingType as BillingType,
        isDeleted: false,
      },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByBatchId(batchId: string): Promise<Invoice[]> {
    const entities = await this.repository.find({
      where: {
        batchId,
        isDeleted: false,
      },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async delete(invoiceId: string): Promise<void> {
    await this.repository.update(invoiceId, { isDeleted: true });
  }
}
