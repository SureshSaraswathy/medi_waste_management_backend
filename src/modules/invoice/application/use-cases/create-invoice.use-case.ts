import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceNumberService } from '../services/invoice-number.service';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceLockService } from '../services/invoice-lock.service';
import { DuplicateInvoiceException, InvalidInvoiceDataException } from '../../domain/exceptions/invoice.exceptions';
import { HcfNotFoundException } from '../../../hcf/domain/exceptions/hcf.exceptions';
import { CompanyNotFoundException } from '../../../company/domain/exceptions/company.exceptions';
import { BillingOption, InvoiceGenerationType } from '../../infrastructure/transaction/invoice.entity';

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceLockService: InvoiceLockService,
  ) {}

  async execute(createInvoiceDto: CreateInvoiceDto, createdBy?: string): Promise<Invoice> {
    // Validate HCF exists
    const hcf = await this.hcfRepository.findById(createInvoiceDto.hcfId);
    if (!hcf) {
      throw new HcfNotFoundException(createInvoiceDto.hcfId);
    }

    // Validate Company exists
    const company = await this.companyRepository.findById(createInvoiceDto.companyId);
    if (!company) {
      throw new CompanyNotFoundException(createInvoiceDto.companyId);
    }

    // Validate billing data based on billing option
    this.validateBillingData(createInvoiceDto);

    const invoiceDate = new Date(createInvoiceDto.invoiceDate);
    const dueDate = new Date(createInvoiceDto.dueDate);

    // Check for duplicate invoice (if auto-generation)
    if (createInvoiceDto.generationType === InvoiceGenerationType.AUTO && createInvoiceDto.billingPeriodStart && createInvoiceDto.billingPeriodEnd) {
      const duplicate = await this.invoiceRepository.findDuplicateInvoice({
        companyId: createInvoiceDto.companyId,
        hcfId: createInvoiceDto.hcfId,
        billingPeriodStart: new Date(createInvoiceDto.billingPeriodStart),
        billingPeriodEnd: new Date(createInvoiceDto.billingPeriodEnd),
        billingType: createInvoiceDto.billingType,
      });

      if (duplicate) {
        throw new DuplicateInvoiceException(
          `Invoice already exists for HCF ${hcf.hcfCode} for the period ${createInvoiceDto.billingPeriodStart} to ${createInvoiceDto.billingPeriodEnd}`
        );
      }
    }

    // Generate invoice number
    const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(invoiceDate);

    // Calculate invoice amounts
    const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
      billingOption: createInvoiceDto.billingOption,
      bedCount: createInvoiceDto.bedCount,
      bedRate: createInvoiceDto.bedRate,
      weightInKg: createInvoiceDto.weightInKg,
      kgRate: createInvoiceDto.kgRate,
      lumpsumAmount: createInvoiceDto.lumpsumAmount,
      isGSTExempt: hcf.isGSTExempt,
      isInterState: false, // TODO: Determine based on company and HCF state
    });

    // Create invoice
    const invoice = Invoice.create({
      invoiceId: randomUUID(),
      companyId: createInvoiceDto.companyId,
      hcfId: createInvoiceDto.hcfId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      billingType: createInvoiceDto.billingType,
      billingDays: createInvoiceDto.billingDays,
      billingOption: createInvoiceDto.billingOption,
      generationType: createInvoiceDto.generationType ?? InvoiceGenerationType.MANUAL,
      bedCount: createInvoiceDto.bedCount,
      bedRate: createInvoiceDto.bedRate,
      weightInKg: createInvoiceDto.weightInKg,
      kgRate: createInvoiceDto.kgRate,
      lumpsumAmount: createInvoiceDto.lumpsumAmount,
      taxableValue: createInvoiceDto.taxableValue ?? calculationResult.taxableValue,
      igst: createInvoiceDto.igst ?? calculationResult.igst,
      cgst: createInvoiceDto.cgst ?? calculationResult.cgst,
      sgst: createInvoiceDto.sgst ?? calculationResult.sgst,
      roundOff: createInvoiceDto.roundOff ?? calculationResult.roundOff,
      invoiceValue: createInvoiceDto.invoiceValue ?? calculationResult.invoiceValue,
      financialYear,
      sequenceNumber,
      billingPeriodStart: createInvoiceDto.billingPeriodStart ? new Date(createInvoiceDto.billingPeriodStart) : null,
      billingPeriodEnd: createInvoiceDto.billingPeriodEnd ? new Date(createInvoiceDto.billingPeriodEnd) : null,
      notes: createInvoiceDto.notes,
      createdBy: createdBy || null,
    });

    // Check and lock if needed
    this.invoiceLockService.checkAndLockInvoice(invoice);

    // Save invoice
    return await this.invoiceRepository.create(invoice);
  }

  private validateBillingData(dto: CreateInvoiceDto): void {
    switch (dto.billingOption) {
      case BillingOption.BED_WISE:
        if (!dto.bedCount || dto.bedCount <= 0) {
          throw new InvalidInvoiceDataException('Bed count is required and must be greater than 0 for bed-wise billing');
        }
        if (!dto.bedRate || dto.bedRate <= 0) {
          throw new InvalidInvoiceDataException('Bed rate is required and must be greater than 0 for bed-wise billing');
        }
        break;

      case BillingOption.WEIGHT_WISE:
        if (!dto.weightInKg || dto.weightInKg <= 0) {
          throw new InvalidInvoiceDataException('Weight in kg is required and must be greater than 0 for weight-wise billing');
        }
        if (!dto.kgRate || dto.kgRate <= 0) {
          throw new InvalidInvoiceDataException('Kg rate is required and must be greater than 0 for weight-wise billing');
        }
        break;

      case BillingOption.LUMPSUM:
        if (!dto.lumpsumAmount || dto.lumpsumAmount <= 0) {
          throw new InvalidInvoiceDataException('Lumpsum amount is required and must be greater than 0 for lumpsum billing');
        }
        break;
    }
  }
}
