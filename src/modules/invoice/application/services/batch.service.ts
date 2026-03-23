import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceBatchEntity, BatchType, BatchStatus } from '../../infrastructure/transaction/invoice-batch.entity';
import { InvoiceBatchItemEntity } from '../../infrastructure/transaction/invoice-batch-item.entity';
import { IBatchRepository, BATCH_REPOSITORY_TOKEN } from '../../domain/interfaces/batch.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../../waste-transaction/domain/interfaces/waste-transaction.repository.interface';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { BatchResponseDto, BatchItemResponseDto, BatchPreviewResponseDto } from '../dto/batch-response.dto';
import { InvoiceCalculationService } from './invoice-calculation.service';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { BillingOption, InvoiceGenerationType, BillingType, InvoiceStatus } from '../../infrastructure/transaction/invoice.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class BatchService {
  constructor(
    @Inject(BATCH_REPOSITORY_TOKEN)
    private readonly batchRepository: IBatchRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  /**
   * Generate draft invoices directly (creates Invoice records with DRAFT status)
   */
  async generateDraftInvoices(dto: CreateBatchDto, createdBy?: string): Promise<{ batchId: string; invoiceCount: number }> {
    // Create batch entity
    const batch = new InvoiceBatchEntity();
    batch.id = randomUUID();
    batch.type = dto.type;
    batch.companyId = dto.companyId;
    batch.siteId = dto.siteId || null;
    batch.periodFrom = dto.periodFrom ? new Date(dto.periodFrom) : null;
    batch.periodTo = dto.periodTo ? new Date(dto.periodTo) : null;
    batch.billingMonth = dto.billingMonth || null;
    batch.status = BatchStatus.STAGED;
    batch.totalRecords = 0;
    batch.createdBy = createdBy || null;

    const savedBatch = await this.batchRepository.create(batch);

    // Generate draft invoices based on type
    let invoiceCount = 0;
    
    if (dto.type === BatchType.WEIGHT) {
      invoiceCount = await this.generateWeightDraftInvoices(savedBatch, dto, createdBy);
    } else if (dto.type === BatchType.BED) {
      invoiceCount = await this.generateBedDraftInvoices(savedBatch, dto, createdBy);
    }

    // Update batch total records
    savedBatch.totalRecords = invoiceCount;
    await this.batchRepository.update(savedBatch);

    return { batchId: savedBatch.id, invoiceCount };
  }

  /**
   * Generate a batch (STAGED status) - does NOT create invoices
   */
  async generateBatch(dto: CreateBatchDto, createdBy?: string): Promise<BatchResponseDto> {
    // Create batch entity
    const batch = new InvoiceBatchEntity();
    batch.id = randomUUID();
    batch.type = dto.type;
    batch.companyId = dto.companyId;
    batch.siteId = dto.siteId || null;
    batch.periodFrom = dto.periodFrom ? new Date(dto.periodFrom) : null;
    batch.periodTo = dto.periodTo ? new Date(dto.periodTo) : null;
    batch.billingMonth = dto.billingMonth || null;
    batch.status = BatchStatus.STAGED;
    batch.totalRecords = 0;
    batch.createdBy = createdBy || null;

    const savedBatch = await this.batchRepository.create(batch);

    // Generate batch items based on type
    let items: InvoiceBatchItemEntity[] = [];
    
    if (dto.type === BatchType.WEIGHT) {
      items = await this.generateWeightBatchItems(savedBatch, dto);
    } else if (dto.type === BatchType.BED) {
      items = await this.generateBedBatchItems(savedBatch, dto);
    }

    // Update batch total records
    savedBatch.totalRecords = items.length;
    await this.batchRepository.update(savedBatch);

    return this.toBatchResponseDto(savedBatch);
  }

  /**
   * Generate batch items for weight-based billing
   */
  private async generateWeightBatchItems(
    batch: InvoiceBatchEntity,
    dto: CreateBatchDto,
  ): Promise<InvoiceBatchItemEntity[]> {
    if (!dto.periodFrom || !dto.periodTo) {
      throw new BadRequestException('Period dates are required for weight-based billing');
    }

    const periodFrom = new Date(dto.periodFrom);
    const periodTo = new Date(dto.periodTo);
    const dueDate = new Date(periodTo);
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

    // Get all active HCFs for the company with Weight-wise billing option and kgRate configured
    const allHcfs = await this.hcfRepository.findByCompany(dto.companyId);
    const activeHcfs = allHcfs.filter(hcf => {
      if (hcf.status !== 'Active' || hcf.isDeleted) return false;
      if (hcf.billingOption !== 'Weight-wise') return false;
      if (!hcf.kgRate) return false;
      const kgRate = parseFloat(hcf.kgRate);
      return !isNaN(kgRate) && kgRate > 0;
    });

    const items: InvoiceBatchItemEntity[] = [];

    for (const hcf of activeHcfs) {
      try {
        // Get waste transactions for the period
        const allTransactions = await this.wasteTransactionRepository.findAll();
        const transactions = allTransactions.filter(t =>
          t.companyId === dto.companyId &&
          t.hcfId === hcf.hcfId &&
          t.pickupDate >= periodFrom &&
          t.pickupDate <= periodTo &&
          t.status === 'Verified'
        );

        if (transactions.length === 0) {
          // Create item with error flag
          const errorItem = this.createBatchItem(batch, hcf.hcfId, {
            quantity: 0,
            rate: hcf.kgRate ? parseFloat(hcf.kgRate) : 0,
            taxPercent: 18, // Default GST
            amount: 0,
            dueDate,
            errorFlag: true,
            errorMessage: 'No verified waste transactions found for the period',
          });
          items.push(errorItem);
          continue;
        }

        // Sum all weights
        let totalWeight = 0;
        for (const transaction of transactions) {
          if (transaction.yellowWeightKg) totalWeight += Number(transaction.yellowWeightKg);
          if (transaction.redWeightKg) totalWeight += Number(transaction.redWeightKg);
          if (transaction.blueWeightKg) totalWeight += Number(transaction.blueWeightKg);
          if (transaction.whiteWeightKg) totalWeight += Number(transaction.whiteWeightKg);
        }

        if (totalWeight <= 0) {
          const errorItem = this.createBatchItem(batch, hcf.hcfId, {
            quantity: totalWeight,
            rate: hcf.kgRate ? parseFloat(hcf.kgRate) : 0,
            taxPercent: 18,
            amount: 0,
            dueDate,
            errorFlag: true,
            errorMessage: 'Total weight is zero or negative',
          });
          items.push(errorItem);
          continue;
        }

        const kgRate = hcf.kgRate ? parseFloat(hcf.kgRate) : 0;
        if (!kgRate || kgRate <= 0) {
          const errorItem = this.createBatchItem(batch, hcf.hcfId, {
            quantity: totalWeight,
            rate: 0,
            taxPercent: 18,
            amount: 0,
            dueDate,
            errorFlag: true,
            errorMessage: 'Kg rate is not configured for this HCF',
          });
          items.push(errorItem);
          continue;
        }

        // Calculate amount
        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.WEIGHT_WISE,
          weightInKg: totalWeight,
          kgRate: kgRate,
          isInterState: false,
          gstRate: 18,
        });

        const item = this.createBatchItem(batch, hcf.hcfId, {
          quantity: totalWeight,
          rate: kgRate,
          taxPercent: 18,
          amount: calculationResult.invoiceValue,
          dueDate,
          description: `Weight-based billing for period ${periodFrom.toISOString().split('T')[0]} to ${periodTo.toISOString().split('T')[0]}. Total weight: ${totalWeight.toFixed(2)} kg`,
        });
        items.push(item);
      } catch (error: any) {
        const errorItem = this.createBatchItem(batch, hcf.hcfId, {
          quantity: 0,
          rate: 0,
          taxPercent: 0,
          amount: 0,
          dueDate,
          errorFlag: true,
          errorMessage: error.message || 'Failed to calculate charges',
        });
        items.push(errorItem);
      }
    }

    // Save all items
    for (const item of items) {
      await this.batchRepository.createItem(item);
    }

    return items;
  }

  /**
   * Generate batch items for bed/lumpsum billing
   */
  private async generateBedBatchItems(
    batch: InvoiceBatchEntity,
    dto: CreateBatchDto,
  ): Promise<InvoiceBatchItemEntity[]> {
    if (!dto.billingMonth) {
      throw new BadRequestException('Billing month is required for bed/lumpsum billing');
    }

    // Parse billing month (format: "2024-01" or "January 2024")
    const [year, month] = dto.billingMonth.split('-').map(Number);
    const billingPeriodStart = new Date(year, month - 1, 1);
    const billingPeriodEnd = new Date(year, month, 0);
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 30);

    // Get all active HCFs with AutoGeneration enabled and Bed-wise or Lumpsum billing configured
    const allHcfs = await this.hcfRepository.findByCompany(dto.companyId);
    const activeHcfs = allHcfs.filter(hcf => {
      if (hcf.status !== 'Active' || hcf.isDeleted || !hcf.autoGen) return false;
      
      // Check if HCF has Bed-wise billing configured
      if (hcf.billingOption === 'Bed-wise' && hcf.bedCount && hcf.bedRate) {
        const bedCount = parseInt(hcf.bedCount);
        const bedRate = parseFloat(hcf.bedRate);
        if (!isNaN(bedCount) && bedCount > 0 && !isNaN(bedRate) && bedRate > 0) {
          return true;
        }
      }
      
      // Check if HCF has Lumpsum billing configured
      if (hcf.billingOption === 'Lumpsum' && hcf.lumpsum) {
        const lumpsum = parseFloat(hcf.lumpsum);
        if (!isNaN(lumpsum) && lumpsum > 0) {
          return true;
        }
      }
      
      return false;
    });

    const items: InvoiceBatchItemEntity[] = [];

    for (const hcf of activeHcfs) {
      try {
        // Check for duplicate invoice
        const existingInvoice = await this.invoiceRepository.findDuplicateInvoice({
          companyId: dto.companyId,
          hcfId: hcf.hcfId,
          billingPeriodStart,
          billingPeriodEnd,
          billingType: BillingType.MONTHLY,
        });

        if (existingInvoice) {
          const errorItem = this.createBatchItem(batch, hcf.hcfId, {
            quantity: 0,
            rate: 0,
            taxPercent: 0,
            amount: 0,
            dueDate,
            errorFlag: true,
            errorMessage: 'Invoice already exists for this period',
            isSelected: false,
          });
          items.push(errorItem);
          continue;
        }

        // Determine billing option and calculate (should match filter criteria)
        let quantity = 0;
        let rate = 0;
        let amount = 0;
        let description = '';

        if (hcf.billingOption === 'Bed-wise' && hcf.bedCount && hcf.bedRate) {
          quantity = parseInt(hcf.bedCount);
          rate = parseFloat(hcf.bedRate);
          const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
            billingOption: BillingOption.BED_WISE,
            bedCount: quantity,
            bedRate: rate,
            isInterState: false,
            gstRate: 18,
          });
          amount = calculationResult.invoiceValue;
          description = `Bed-wise billing for ${dto.billingMonth}. Bed count: ${quantity}, Rate: ₹${rate}`;
        } else if (hcf.billingOption === 'Lumpsum' && hcf.lumpsum) {
          quantity = 1;
          rate = parseFloat(hcf.lumpsum);
          const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
            billingOption: BillingOption.LUMPSUM,
            lumpsumAmount: rate,
            isInterState: false,
            gstRate: 18,
          });
          amount = calculationResult.invoiceValue;
          description = `Lumpsum billing for ${dto.billingMonth}. Amount: ₹${rate}`;
        } else {
          // This should not happen due to filter, but handle gracefully
          const errorItem = this.createBatchItem(batch, hcf.hcfId, {
            quantity: 0,
            rate: 0,
            taxPercent: 0,
            amount: 0,
            dueDate,
            errorFlag: true,
            errorMessage: 'Billing option or rates not configured',
          });
          items.push(errorItem);
          continue;
        }

        const item = this.createBatchItem(batch, hcf.hcfId, {
          quantity,
          rate,
          taxPercent: 18,
          amount,
          dueDate,
          description,
        });
        items.push(item);
      } catch (error: any) {
        const errorItem = this.createBatchItem(batch, hcf.hcfId, {
          quantity: 0,
          rate: 0,
          taxPercent: 0,
          amount: 0,
          dueDate,
          errorFlag: true,
          errorMessage: error.message || 'Failed to calculate charges',
        });
        items.push(errorItem);
      }
    }

    // Save all items
    for (const item of items) {
      await this.batchRepository.createItem(item);
    }

    return items;
  }

  /**
   * Helper to create batch item
   */
  private createBatchItem(
    batch: InvoiceBatchEntity,
    customerId: string,
    data: {
      quantity: number;
      rate: number;
      taxPercent: number;
      amount: number;
      dueDate: Date;
      description?: string;
      errorFlag?: boolean;
      errorMessage?: string;
      isSelected?: boolean;
    },
  ): InvoiceBatchItemEntity {
    const item = new InvoiceBatchItemEntity();
    item.id = randomUUID();
    item.batchId = batch.id;
    item.customerId = customerId;
    item.description = data.description || null;
    item.quantity = data.quantity;
    item.rate = data.rate;
    item.taxPercent = data.taxPercent;
    item.amount = data.amount;
    item.dueDate = data.dueDate;
    item.errorFlag = data.errorFlag || false;
    item.errorMessage = data.errorMessage || null;
    item.isSelected = data.isSelected !== undefined ? data.isSelected : true;
    return item;
  }

  /**
   * Get batch preview with items
   */
  async getBatchPreview(batchId: string): Promise<BatchPreviewResponseDto> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    const items = await this.batchRepository.findItemsByBatchId(batchId);

    return {
      ...this.toBatchResponseDto(batch),
      items: items.map(item => this.toBatchItemResponseDto(item)),
    };
  }

  /**
   * Post batch - convert batch items to invoices
   */
  async postBatch(batchId: string, invoiceDate: Date, createdBy?: string): Promise<{ success: number; failed: number }> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    if (batch.status !== BatchStatus.STAGED) {
      throw new BadRequestException(`Batch is not in STAGED status. Current status: ${batch.status}`);
    }

    // Update batch status to PROCESSING
    batch.status = BatchStatus.PROCESSING;
    await this.batchRepository.update(batch);

    const items = await this.batchRepository.findItemsByBatchId(batchId);
    const selectedItems = items.filter(item => item.isSelected && !item.errorFlag);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of selectedItems) {
        try {
          await this.createInvoiceFromBatchItem(batch, item, invoiceDate, createdBy);
          successCount++;
        } catch (error: any) {
          failedCount++;
          // Update item with error
          item.errorFlag = true;
          item.errorMessage = error.message || 'Failed to create invoice';
          await this.batchRepository.updateItem(item);
        }
      }

      // Update batch status to POSTED
      batch.status = BatchStatus.POSTED;
      batch.postedAt = new Date();
      await this.batchRepository.update(batch);
    } catch (error) {
      // If posting fails, mark batch as FAILED
      batch.status = BatchStatus.FAILED;
      await this.batchRepository.update(batch);
      throw error;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Generate weight-based draft invoices
   */
  private async generateWeightDraftInvoices(
    batch: InvoiceBatchEntity,
    dto: CreateBatchDto,
    createdBy?: string,
  ): Promise<number> {
    if (!dto.periodFrom || !dto.periodTo) {
      throw new BadRequestException('Period dates are required for weight-based billing');
    }

    const periodFrom = new Date(dto.periodFrom);
    const periodTo = new Date(dto.periodTo);
    const invoiceDate = new Date();
    const dueDate = new Date(periodTo);
    dueDate.setDate(dueDate.getDate() + 30);

    const allHcfs = await this.hcfRepository.findByCompany(dto.companyId);
    // Filter HCFs: Active, not deleted, Weight-wise billing option, and kgRate configured
    const activeHcfs = allHcfs.filter(hcf => {
      if (hcf.status !== 'Active' || hcf.isDeleted) return false;
      if (hcf.billingOption !== 'Weight-wise') return false;
      if (!hcf.kgRate) return false;
      const kgRate = parseFloat(hcf.kgRate);
      return !isNaN(kgRate) && kgRate > 0;
    });

    let count = 0;

    for (const hcf of activeHcfs) {
      try {
        const allTransactions = await this.wasteTransactionRepository.findAll();
        const transactions = allTransactions.filter(t =>
          t.companyId === dto.companyId &&
          t.hcfId === hcf.hcfId &&
          t.pickupDate >= periodFrom &&
          t.pickupDate <= periodTo &&
          t.status === 'Verified'
        );

        if (transactions.length === 0) continue;

        let totalWeight = 0;
        for (const transaction of transactions) {
          if (transaction.yellowWeightKg) totalWeight += Number(transaction.yellowWeightKg);
          if (transaction.redWeightKg) totalWeight += Number(transaction.redWeightKg);
          if (transaction.blueWeightKg) totalWeight += Number(transaction.blueWeightKg);
          if (transaction.whiteWeightKg) totalWeight += Number(transaction.whiteWeightKg);
        }

        if (totalWeight <= 0) continue;

        const kgRate = hcf.kgRate ? parseFloat(hcf.kgRate) : 0;
        if (!kgRate || kgRate <= 0) continue;

        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.WEIGHT_WISE,
          weightInKg: totalWeight,
          kgRate: kgRate,
          isInterState: false,
          gstRate: 18,
        });

        const invoice = Invoice.create({
          invoiceId: randomUUID(),
          companyId: batch.companyId,
          hcfId: hcf.hcfId,
          invoiceNumber: '', // Will be generated on post
          invoiceDate,
          dueDate,
          billingType: BillingType.MONTHLY,
          billingDays: Math.ceil((periodTo.getTime() - periodFrom.getTime()) / (1000 * 60 * 60 * 24)),
          billingOption: BillingOption.WEIGHT_WISE,
          generationType: InvoiceGenerationType.AUTO,
          bedCount: null,
          bedRate: null,
          weightInKg: totalWeight,
          kgRate: kgRate,
          lumpsumAmount: null,
          taxableValue: calculationResult.taxableValue,
          igst: calculationResult.igst,
          cgst: calculationResult.cgst,
          sgst: calculationResult.sgst,
          roundOff: calculationResult.roundOff,
          invoiceValue: calculationResult.invoiceValue,
          financialYear: '', // Will be generated on post
          sequenceNumber: 0, // Will be generated on post
          billingPeriodStart: periodFrom,
          billingPeriodEnd: periodTo,
          notes: `Weight-based billing for period ${periodFrom.toISOString().split('T')[0]} to ${periodTo.toISOString().split('T')[0]}. Total weight: ${totalWeight.toFixed(2)} kg`,
          createdBy: createdBy || null,
          status: InvoiceStatus.DRAFT,
          batchId: batch.id,
          postedAt: null,
        });

        await this.invoiceRepository.create(invoice);
        count++;
      } catch (error: any) {
        console.error(`Failed to create draft invoice for HCF ${hcf.hcfCode}:`, error);
      }
    }

    return count;
  }

  /**
   * Generate bed/lumpsum draft invoices
   */
  private async generateBedDraftInvoices(
    batch: InvoiceBatchEntity,
    dto: CreateBatchDto,
    createdBy?: string,
  ): Promise<number> {
    if (!dto.billingMonth) {
      throw new BadRequestException('Billing month is required for bed/lumpsum billing');
    }

    const [year, month] = dto.billingMonth.split('-').map(Number);
    const billingPeriodStart = new Date(year, month - 1, 1);
    const billingPeriodEnd = new Date(year, month, 0);
    const invoiceDate = new Date();
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 30);

    const allHcfs = await this.hcfRepository.findByCompany(dto.companyId);
    // Filter HCFs: Active, not deleted, autoGen enabled, and Bed-wise or Lumpsum billing option with rates configured
    const activeHcfs = allHcfs.filter(hcf => {
      if (hcf.status !== 'Active' || hcf.isDeleted || !hcf.autoGen) return false;
      
      // Check if HCF has Bed-wise billing configured
      if (hcf.billingOption === 'Bed-wise' && hcf.bedCount && hcf.bedRate && 
          parseInt(hcf.bedCount) > 0 && parseFloat(hcf.bedRate) > 0) {
        return true;
      }
      
      // Check if HCF has Lumpsum billing configured
      if (hcf.billingOption === 'Lumpsum' && hcf.lumpsum && parseFloat(hcf.lumpsum) > 0) {
        return true;
      }
      
      return false;
    });

    let count = 0;

    for (const hcf of activeHcfs) {
      try {
        // Check for duplicate
        const existingInvoice = await this.invoiceRepository.findDuplicateInvoice({
          companyId: dto.companyId,
          hcfId: hcf.hcfId,
          billingPeriodStart,
          billingPeriodEnd,
          billingType: BillingType.MONTHLY,
        });

        if (existingInvoice) continue;

        let quantity = 0;
        let rate = 0;
        let billingOption: BillingOption;
        let bedCount: number | null = null;
        let bedRate: number | null = null;
        let weightInKg: number | null = null;
        let kgRate: number | null = null;
        let lumpsumAmount: number | null = null;

        if (hcf.billingOption === 'Bed-wise' && hcf.bedCount && hcf.bedRate) {
          quantity = parseInt(hcf.bedCount);
          rate = parseFloat(hcf.bedRate);
          billingOption = BillingOption.BED_WISE;
          bedCount = quantity;
          bedRate = rate;
        } else if (hcf.billingOption === 'Lumpsum' && hcf.lumpsum) {
          quantity = 1;
          rate = parseFloat(hcf.lumpsum);
          billingOption = BillingOption.LUMPSUM;
          lumpsumAmount = rate;
        } else {
          // This should not happen due to filter, but skip just in case
          continue;
        }

        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption,
          bedCount: bedCount || undefined,
          bedRate: bedRate || undefined,
          lumpsumAmount: lumpsumAmount || undefined,
          isInterState: false,
          gstRate: 18,
        });

        const invoice = Invoice.create({
          invoiceId: randomUUID(),
          companyId: batch.companyId,
          hcfId: hcf.hcfId,
          invoiceNumber: '', // Will be generated on post
          invoiceDate,
          dueDate,
          billingType: BillingType.MONTHLY,
          billingDays: null,
          billingOption,
          generationType: InvoiceGenerationType.AUTO,
          bedCount,
          bedRate,
          weightInKg,
          kgRate,
          lumpsumAmount,
          taxableValue: calculationResult.taxableValue,
          igst: calculationResult.igst,
          cgst: calculationResult.cgst,
          sgst: calculationResult.sgst,
          roundOff: calculationResult.roundOff,
          invoiceValue: calculationResult.invoiceValue,
          financialYear: '', // Will be generated on post
          sequenceNumber: 0, // Will be generated on post
          billingPeriodStart,
          billingPeriodEnd,
          notes: `Bed/Lumpsum billing for ${dto.billingMonth}`,
          createdBy: createdBy || null,
          status: InvoiceStatus.DRAFT,
          batchId: batch.id,
          postedAt: null,
        });

        await this.invoiceRepository.create(invoice);
        count++;
      } catch (error: any) {
        console.error(`Failed to create draft invoice for HCF ${hcf.hcfCode}:`, error);
      }
    }

    return count;
  }

  /**
   * Get draft invoices for a batch
   */
  async getDraftInvoicesByBatch(batchId: string): Promise<Invoice[]> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    const invoices = await this.invoiceRepository.findByBatchId(batchId);
    return invoices.filter(inv => inv.status === InvoiceStatus.DRAFT);
  }

  /**
   * Update a draft invoice
   */
  async updateDraftInvoice(invoiceId: string, updates: {
    quantity?: number;
    rate?: number;
    dueDate?: Date;
  }, modifiedBy?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be updated');
    }

    // Recalculate if quantity or rate changed
    if (updates.quantity !== undefined || updates.rate !== undefined) {
      const quantity = updates.quantity !== undefined ? updates.quantity : (invoice.weightInKg || invoice.bedCount || 1);
      const rate = updates.rate !== undefined ? updates.rate : (invoice.kgRate || invoice.bedRate || invoice.lumpsumAmount || 0);

      let billingOption = invoice.billingOption;
      if (invoice.billingOption === BillingOption.WEIGHT_WISE) {
        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.WEIGHT_WISE,
          weightInKg: quantity,
          kgRate: rate,
          isInterState: false,
          gstRate: 18,
        });
        invoice.update({
          weightInKg: quantity,
          kgRate: rate,
          taxableValue: calculationResult.taxableValue,
          igst: calculationResult.igst,
          cgst: calculationResult.cgst,
          sgst: calculationResult.sgst,
          roundOff: calculationResult.roundOff,
          invoiceValue: calculationResult.invoiceValue,
          modifiedBy: modifiedBy || null,
        });
      } else if (invoice.billingOption === BillingOption.BED_WISE) {
        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.BED_WISE,
          bedCount: quantity,
          bedRate: rate,
          isInterState: false,
          gstRate: 18,
        });
        invoice.update({
          bedCount: quantity,
          bedRate: rate,
          taxableValue: calculationResult.taxableValue,
          igst: calculationResult.igst,
          cgst: calculationResult.cgst,
          sgst: calculationResult.sgst,
          roundOff: calculationResult.roundOff,
          invoiceValue: calculationResult.invoiceValue,
          modifiedBy: modifiedBy || null,
        });
      } else if (invoice.billingOption === BillingOption.LUMPSUM) {
        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.LUMPSUM,
          lumpsumAmount: rate,
          isInterState: false,
          gstRate: 18,
        });
        invoice.update({
          lumpsumAmount: rate,
          taxableValue: calculationResult.taxableValue,
          igst: calculationResult.igst,
          cgst: calculationResult.cgst,
          sgst: calculationResult.sgst,
          roundOff: calculationResult.roundOff,
          invoiceValue: calculationResult.invoiceValue,
          modifiedBy: modifiedBy || null,
        });
      }
    }

    if (updates.dueDate) {
      invoice.update({ dueDate: updates.dueDate, modifiedBy: modifiedBy || null });
    }

    return await this.invoiceRepository.update(invoice);
  }

  /**
   * Post draft invoices (change status to POSTED/DUE, generate numbers, PDFs)
   */
  async postDraftInvoices(invoiceIds: string[], invoiceDate: Date, createdBy?: string): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;
    const touchedBatchIds = new Set<string>();

    for (const invoiceId of invoiceIds) {
      try {
        const invoice = await this.invoiceRepository.findById(invoiceId);
        if (!invoice || invoice.status !== InvoiceStatus.DRAFT) {
          failedCount++;
          continue;
        }
        if (invoice.batchId) {
          touchedBatchIds.add(invoice.batchId);
        }

        // Generate invoice number if not already generated
        if (!invoice.invoiceNumber) {
          const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(invoiceDate);
          (invoice as any).invoiceNumber = invoiceNumber;
          (invoice as any).financialYear = financialYear;
          (invoice as any).sequenceNumber = sequenceNumber;
        }

        // Post the invoice
        invoice.post();
        (invoice as any).status = InvoiceStatus.DUE;
        (invoice as any).postedAt = new Date();
        (invoice as any).modifiedBy = createdBy || null;

        await this.invoiceRepository.update(invoice);

        // Generate PDF
        await this.invoicePdfService.generateInvoicePdf(invoice.invoiceId, 'save');

        successCount++;
      } catch (error: any) {
        console.error(`Failed to post invoice ${invoiceId}:`, error);
        failedCount++;
      }
    }

    // Reconcile batch status/count after posting draft invoices.
    for (const batchId of touchedBatchIds) {
      try {
        const batch = await this.batchRepository.findById(batchId);
        if (!batch) continue;

        const batchInvoices = await this.invoiceRepository.findByBatchId(batchId);
        const remainingDrafts = batchInvoices.filter(inv => inv.status === InvoiceStatus.DRAFT).length;

        // Keep totalRecords aligned with currently editable draft rows.
        batch.totalRecords = remainingDrafts;

        // Mark batch as posted only when all draft invoices are posted.
        if (remainingDrafts === 0) {
          batch.status = BatchStatus.POSTED;
          batch.postedAt = new Date();
        } else {
          batch.status = BatchStatus.STAGED;
          batch.postedAt = null;
        }

        await this.batchRepository.update(batch);
      } catch (error) {
        // Do not fail posting flow if reconciliation fails for one batch.
        console.error(`Failed to reconcile batch ${batchId} after draft posting:`, error);
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Create invoice from batch item
   */
  private async createInvoiceFromBatchItem(
    batch: InvoiceBatchEntity,
    item: InvoiceBatchItemEntity,
    invoiceDate: Date,
    createdBy?: string,
  ): Promise<Invoice> {
    const hcf = await this.hcfRepository.findById(item.customerId);
    if (!hcf) {
      throw new Error(`HCF not found: ${item.customerId}`);
    }

    // Determine billing option
    let billingOption: BillingOption;
    let bedCount: number | null = null;
    let bedRate: number | null = null;
    let weightInKg: number | null = null;
    let kgRate: number | null = null;
    let lumpsumAmount: number | null = null;

    if (batch.type === BatchType.WEIGHT) {
      billingOption = BillingOption.WEIGHT_WISE;
      weightInKg = item.quantity;
      kgRate = item.rate;
    } else if (batch.type === BatchType.BED) {
      if (hcf.billingOption === 'Bed-wise') {
        billingOption = BillingOption.BED_WISE;
        bedCount = item.quantity;
        bedRate = item.rate;
      } else {
        billingOption = BillingOption.LUMPSUM;
        lumpsumAmount = item.amount;
      }
    } else {
      throw new Error(`Unsupported batch type: ${batch.type}`);
    }

    // Calculate invoice amounts
    const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
      billingOption,
      bedCount,
      bedRate,
      weightInKg,
      kgRate,
      lumpsumAmount,
      isInterState: false,
      gstRate: item.taxPercent,
    });

    // Generate invoice number
    const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(invoiceDate);

    // Create invoice
    const invoice = Invoice.create({
      invoiceId: randomUUID(),
      companyId: batch.companyId,
      hcfId: item.customerId,
      invoiceNumber,
      invoiceDate,
      dueDate: item.dueDate,
      billingType: batch.type === BatchType.BED ? BillingType.MONTHLY : BillingType.MONTHLY,
      billingDays: batch.periodFrom && batch.periodTo
        ? Math.ceil((batch.periodTo.getTime() - batch.periodFrom.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      billingOption,
      generationType: InvoiceGenerationType.AUTO,
      bedCount,
      bedRate,
      weightInKg,
      kgRate,
      lumpsumAmount,
      taxableValue: calculationResult.taxableValue,
      igst: calculationResult.igst,
      cgst: calculationResult.cgst,
      sgst: calculationResult.sgst,
      roundOff: calculationResult.roundOff,
      invoiceValue: calculationResult.invoiceValue,
      financialYear,
      sequenceNumber,
      billingPeriodStart: batch.periodFrom,
      billingPeriodEnd: batch.periodTo,
      notes: item.description,
      createdBy: createdBy || null,
      batchId: batch.id,
      status: InvoiceStatus.DUE,
      postedAt: new Date(),
    });

    const savedInvoice = await this.invoiceRepository.create(invoice);

    // Generate PDF
    try {
      await this.invoicePdfService.generateInvoicePdf(savedInvoice.invoiceId);
    } catch (error) {
      // Log error but don't fail the invoice creation
      console.error(`Failed to generate PDF for invoice ${savedInvoice.invoiceId}:`, error);
    }

    return savedInvoice;
  }

  /**
   * Get all batches
   */
  async getAllBatches(companyId?: string, status?: BatchStatus): Promise<BatchResponseDto[]> {
    const batches = await this.batchRepository.findAll(companyId, status);
    return batches.map(batch => this.toBatchResponseDto(batch));
  }

  /**
   * Convert entity to DTO
   */
  private toBatchResponseDto(entity: InvoiceBatchEntity): BatchResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      companyId: entity.companyId,
      siteId: entity.siteId,
      periodFrom: entity.periodFrom,
      periodTo: entity.periodTo,
      billingMonth: entity.billingMonth,
      status: entity.status,
      totalRecords: entity.totalRecords,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      postedAt: entity.postedAt,
    };
  }

  private toBatchItemResponseDto(entity: InvoiceBatchItemEntity): BatchItemResponseDto {
    return {
      id: entity.id,
      batchId: entity.batchId,
      customerId: entity.customerId,
      description: entity.description,
      quantity: Number(entity.quantity),
      rate: Number(entity.rate),
      taxPercent: Number(entity.taxPercent),
      amount: Number(entity.amount),
      dueDate: entity.dueDate,
      errorFlag: entity.errorFlag,
      errorMessage: entity.errorMessage,
      isSelected: entity.isSelected,
      createdAt: entity.createdAt,
    };
  }
}
