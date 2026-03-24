import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../../waste-transaction/domain/interfaces/waste-transaction.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { GenerateInvoiceDto } from '../dto/generate-invoice.dto';
import { InvoiceNumberService } from '../services/invoice-number.service';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceLockService } from '../services/invoice-lock.service';
import { DuplicateInvoiceException, MissingHcfBillingDataException } from '../../domain/exceptions/invoice.exceptions';
import { BillingOption, InvoiceGenerationType, BillingType } from '../../infrastructure/transaction/invoice.entity';
import { randomUUID } from 'crypto';

interface AutoGenerationResult {
  success: Invoice[];
  failed: Array<{ hcfId: string; hcfCode: string; reason: string }>;
}

@Injectable()
export class GenerateInvoiceAutoUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceLockService: InvoiceLockService,
  ) {}

  async execute(generateInvoiceDto: GenerateInvoiceDto, createdBy?: string): Promise<AutoGenerationResult> {
    const billingPeriodStart = new Date(generateInvoiceDto.billingPeriodStart);
    const billingPeriodEnd = new Date(generateInvoiceDto.billingPeriodEnd);
    const invoiceDate = generateInvoiceDto.invoiceDate ? new Date(generateInvoiceDto.invoiceDate) : billingPeriodEnd;
    const dueDays = generateInvoiceDto.dueDays ?? 30;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Get HCFs to process
    let hcfsToProcess: Array<{ hcfId: string; hcfCode: string }> = [];

    if (generateInvoiceDto.hcfIds && generateInvoiceDto.hcfIds.length > 0) {
      // Process specific HCFs
      for (const hcfId of generateInvoiceDto.hcfIds) {
        const hcf = await this.hcfRepository.findById(hcfId);
        if (hcf) {
          hcfsToProcess.push({ hcfId: hcf.hcfId, hcfCode: hcf.hcfCode });
        }
      }
    } else {
      // Get all active HCFs for the company
      const allHcfs = await this.hcfRepository.findByCompany(generateInvoiceDto.companyId);
      hcfsToProcess = allHcfs
        .filter(hcf => hcf.status === 'Active' && !hcf.isDeleted)
        .map(hcf => ({ hcfId: hcf.hcfId, hcfCode: hcf.hcfCode }));
    }

    const success: Invoice[] = [];
    const failed: Array<{ hcfId: string; hcfCode: string; reason: string }> = [];

    // Process each HCF
    for (const { hcfId, hcfCode } of hcfsToProcess) {
      try {
        const invoice = await this.generateInvoiceForHcf({
          companyId: generateInvoiceDto.companyId,
          hcfId,
          hcfCode,
          billingPeriodStart,
          billingPeriodEnd,
          invoiceDate,
          dueDate,
          billingType: generateInvoiceDto.billingType,
          createdBy,
        });
        success.push(invoice);
      } catch (error: any) {
        // Extract error message from NestJS exceptions or regular errors
        let errorMessage = 'Failed to generate invoice';
        
        // NestJS HttpException has getResponse() method
        if (error?.getResponse) {
          const response = error.getResponse();
          if (typeof response === 'string') {
            errorMessage = response;
          } else if (response && typeof response === 'object' && 'message' in response) {
            const msg = (response as any).message;
            errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
          }
        } else if (error?.message) {
          // Regular Error or Exception
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.toString) {
          errorMessage = error.toString();
        }
        
        // Remove "HCF {hcfId}: " prefix if present (already included in exception)
        if (errorMessage.startsWith(`HCF ${hcfId}: `)) {
          errorMessage = errorMessage.replace(`HCF ${hcfId}: `, '');
        }
        
        console.error(`Failed to generate invoice for HCF ${hcfCode} (${hcfId}):`, errorMessage);
        console.error('Full error object:', error);
        
        failed.push({
          hcfId,
          hcfCode,
          reason: errorMessage,
        });
      }
    }

    return { success, failed };
  }

  private async generateInvoiceForHcf(params: {
    companyId: string;
    hcfId: string;
    hcfCode: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    invoiceDate: Date;
    dueDate: Date;
    billingType: BillingType;
    createdBy?: string;
  }): Promise<Invoice> {
    // Get HCF details
    const hcf = await this.hcfRepository.findById(params.hcfId);
    if (!hcf) {
      throw new MissingHcfBillingDataException(params.hcfId, 'HCF not found');
    }

    // Check for duplicate
    const duplicate = await this.invoiceRepository.findDuplicateInvoice({
      companyId: params.companyId,
      hcfId: params.hcfId,
      billingPeriodStart: params.billingPeriodStart,
      billingPeriodEnd: params.billingPeriodEnd,
      billingType: params.billingType,
    });

    if (duplicate) {
      throw new DuplicateInvoiceException(
        `Invoice already exists for HCF ${params.hcfCode} for the period ${params.billingPeriodStart.toISOString().split('T')[0]} to ${params.billingPeriodEnd.toISOString().split('T')[0]}`
      );
    }

    // Determine billing option from HCF
    let billingOption: BillingOption;
    let bedCount: number | null = null;
    let bedRate: number | null = null;
    let weightInKg: number | null = null;
    let kgRate: number | null = null;
    let lumpsumAmount: number | null = null;

    if (hcf.billingOption) {
      // Use HCF's billing option
      if (hcf.billingOption.toLowerCase().includes('bed')) {
        billingOption = BillingOption.BED_WISE;
        bedCount = hcf.bedCount ? parseInt(hcf.bedCount, 10) : null;
        bedRate = hcf.bedRate ? parseFloat(hcf.bedRate) : null;

        if (!bedCount || !bedRate) {
          throw new MissingHcfBillingDataException(
            params.hcfId,
            `Bed count (${bedCount}) or bed rate (${bedRate}) is missing for bed-wise billing`
          );
        }
      } else if (hcf.billingOption.toLowerCase().includes('weight') || hcf.billingOption.toLowerCase().includes('kg')) {
        billingOption = BillingOption.WEIGHT_WISE;
        kgRate = hcf.kgRate ? parseFloat(hcf.kgRate) : null;

        if (!kgRate) {
          throw new MissingHcfBillingDataException(
            params.hcfId,
            `Kg rate is missing for weight-wise billing`
          );
        }

        // Get total weight from waste transactions
        weightInKg = await this.getTotalWeightForPeriod(
          params.companyId,
          params.hcfId,
          params.billingPeriodStart,
          params.billingPeriodEnd
        );

        if (!weightInKg || weightInKg <= 0) {
          throw new MissingHcfBillingDataException(
            params.hcfId,
            `No waste weight data found for the period ${params.billingPeriodStart.toISOString().split('T')[0]} to ${params.billingPeriodEnd.toISOString().split('T')[0]}`
          );
        }
      } else {
        billingOption = BillingOption.LUMPSUM;
        lumpsumAmount = hcf.lumpsum ? parseFloat(hcf.lumpsum) : null;

        if (!lumpsumAmount) {
          throw new MissingHcfBillingDataException(
            params.hcfId,
            `Lumpsum amount is missing for lumpsum billing`
          );
        }
      }
    } else {
      // Default to bed-wise if billing option not set
      billingOption = BillingOption.BED_WISE;
      bedCount = hcf.bedCount ? parseInt(hcf.bedCount, 10) : null;
      bedRate = hcf.bedRate ? parseFloat(hcf.bedRate) : null;

      if (!bedCount || !bedRate) {
        throw new MissingHcfBillingDataException(
          params.hcfId,
          `Billing option not configured. Bed count (${bedCount}) or bed rate (${bedRate}) is missing`
        );
      }
    }

    // Calculate billing days
    const billingDays = Math.ceil(
      (params.billingPeriodEnd.getTime() - params.billingPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Calculate invoice amounts
    const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
      billingOption,
      bedCount,
      bedRate,
      weightInKg,
      kgRate,
      lumpsumAmount,
      isGSTExempt: hcf.isGSTExempt,
      isInterState: false, // TODO: Determine based on company and HCF state
    });

    // Generate invoice number
    const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(params.invoiceDate);

    // Create invoice
    const invoice = Invoice.create({
      invoiceId: randomUUID(),
      companyId: params.companyId,
      hcfId: params.hcfId,
      invoiceNumber,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      billingType: params.billingType,
      billingDays,
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
      billingPeriodStart: params.billingPeriodStart,
      billingPeriodEnd: params.billingPeriodEnd,
      notes: `Auto-generated invoice for period ${params.billingPeriodStart.toISOString().split('T')[0]} to ${params.billingPeriodEnd.toISOString().split('T')[0]}`,
      createdBy: params.createdBy || null,
    });

    // Same lifecycle as manual post: DUE + postedAt (not POSTED via generate())
    invoice.post();

    this.invoiceLockService.checkAndLockInvoice(invoice);

    // Save invoice
    return await this.invoiceRepository.create(invoice);
  }

  private async getTotalWeightForPeriod(
    companyId: string,
    hcfId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Get waste transactions for the period
    const allTransactions = await this.wasteTransactionRepository.findAll();
    const transactions = allTransactions.filter(t => 
      t.companyId === companyId &&
      t.hcfId === hcfId &&
      t.pickupDate >= startDate &&
      t.pickupDate <= endDate &&
      t.status === 'Verified' // Only count verified transactions
    );

    // Sum all weights (Yellow, Red, Blue, White)
    let totalWeight = 0;
    for (const transaction of transactions) {
      if (transaction.yellowWeightKg) totalWeight += Number(transaction.yellowWeightKg);
      if (transaction.redWeightKg) totalWeight += Number(transaction.redWeightKg);
      if (transaction.blueWeightKg) totalWeight += Number(transaction.blueWeightKg);
      if (transaction.whiteWeightKg) totalWeight += Number(transaction.whiteWeightKg);
    }

    return Math.round(totalWeight * 100) / 100; // Round to 2 decimal places
  }
}
