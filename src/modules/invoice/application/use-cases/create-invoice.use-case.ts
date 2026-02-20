import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { IBatchRepository, BATCH_REPOSITORY_TOKEN } from '../../domain/interfaces/batch.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceNumberService } from '../services/invoice-number.service';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceLockService } from '../services/invoice-lock.service';
import { NotificationHelperService } from '../../../notification/notification-helper.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/notification.entity';
import { NotificationPriority } from '../../../notification/infrastructure/persistence/notification-receiver.entity';
import { DuplicateInvoiceException, InvalidInvoiceDataException } from '../../domain/exceptions/invoice.exceptions';
import { HcfNotFoundException } from '../../../hcf/domain/exceptions/hcf.exceptions';
import { CompanyNotFoundException } from '../../../company/domain/exceptions/company.exceptions';
import { BillingOption, InvoiceGenerationType, InvoiceStatus } from '../../infrastructure/transaction/invoice.entity';
import { InvoiceBatchEntity, BatchType, BatchStatus } from '../../infrastructure/transaction/invoice-batch.entity';

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @Inject(BATCH_REPOSITORY_TOKEN)
    private readonly batchRepository: IBatchRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceLockService: InvoiceLockService,
    @Inject(forwardRef(() => NotificationHelperService))
    private readonly notificationHelper: NotificationHelperService,
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

    // Handle batch creation for manual DRAFT invoices
    let batchId: string | null = null;
    let invoiceNumber = '';
    let financialYear = '';
    let sequenceNumber = 0;
    const invoiceStatus = createInvoiceDto.status ?? InvoiceStatus.DRAFT;

    if (createInvoiceDto.generationType === InvoiceGenerationType.MANUAL && invoiceStatus === InvoiceStatus.DRAFT) {
      // Create or find batch for manual invoices (one batch per day per company)
      const today = new Date().toISOString().split('T')[0];
      const existingBatches = await this.batchRepository.findAll(
        createInvoiceDto.companyId,
        BatchStatus.STAGED,
      );

      // Find batch created today with type MANUAL
      let batch = existingBatches.find(b => {
        const batchDate = new Date(b.createdAt).toISOString().split('T')[0];
        return batchDate === today && b.type === BatchType.MANUAL;
      });

      if (!batch) {
        // Create new batch for today
        const newBatch = new InvoiceBatchEntity();
        newBatch.id = randomUUID();
        newBatch.type = BatchType.MANUAL;
        newBatch.companyId = createInvoiceDto.companyId;
        newBatch.status = BatchStatus.STAGED;
        newBatch.totalRecords = 0;
        newBatch.createdBy = createdBy || null;
        batch = await this.batchRepository.create(newBatch);
      }

      batchId = batch.id;
      // Don't generate invoice number for DRAFT invoices - will be generated on post
    } else {
      // Generate invoice number for non-DRAFT invoices
      const numberResult = await this.invoiceNumberService.generateInvoiceNumber(invoiceDate);
      invoiceNumber = numberResult.invoiceNumber;
      financialYear = numberResult.financialYear;
      sequenceNumber = numberResult.sequenceNumber;
    }

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
      status: invoiceStatus,
      batchId: batchId,
      postedAt: null,
    });

    // Check and lock if needed (only for non-DRAFT invoices)
    if (invoiceStatus !== InvoiceStatus.DRAFT) {
      this.invoiceLockService.checkAndLockInvoice(invoice);
    }

    // Save invoice
    const savedInvoice = await this.invoiceRepository.create(invoice);

    // Update batch total records if batch exists
    if (batchId) {
      const batch = await this.batchRepository.findById(batchId);
      if (batch) {
        batch.totalRecords += 1;
        await this.batchRepository.update(batch);
      }
    }

    // Trigger notifications (only for non-DRAFT invoices)
    if (invoiceStatus !== InvoiceStatus.DRAFT) {
      await this.triggerInvoiceNotifications(savedInvoice, createdBy);
    }

    return savedInvoice;
  }

  private async triggerInvoiceNotifications(
    invoice: Invoice,
    createdBy?: string,
  ): Promise<void> {
    try {
      // Accountant creates invoice → Manager gets approval notification
      // Note: In production, resolve role names to IDs using RoleRepository
      const managerRoleIds: string[] = []; // TODO: Resolve 'Manager' role IDs
      const accountantUserIds: string[] = []; // TODO: Get Accountant user IDs

      await this.notificationHelper.notifyRoles(
        'Invoice Created - Approval Required',
        `Invoice ${invoice.invoiceNumber} created for ${invoice.hcfId}. Amount: ₹${invoice.invoiceValue.toFixed(2)}`,
        'invoice',
        managerRoleIds,
        {
          referenceId: invoice.invoiceId,
          type: NotificationType.APPROVAL,
          priority: NotificationPriority.MEDIUM,
          createdBy,
        },
      );

      // Payment pending → Notify Accountant + Manager
      // This would be triggered when invoice status changes to pending payment
      // For now, we'll add it here as an example
    } catch (error) {
      // Log error but don't fail the invoice creation
      console.error('Failed to send invoice notifications:', error);
    }
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
