import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../../waste-transaction/domain/interfaces/waste-transaction.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { GenerateInvoiceWeightDto } from '../dto/generate-invoice-weight.dto';
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
export class GenerateInvoiceWeightUseCase {
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

  async execute(generateInvoiceDto: GenerateInvoiceWeightDto, createdBy?: string): Promise<AutoGenerationResult> {
    const pickupDateFrom = new Date(generateInvoiceDto.pickupDateFrom);
    const pickupDateTo = new Date(generateInvoiceDto.pickupDateTo);
    const invoiceDate = generateInvoiceDto.invoiceDate ? new Date(generateInvoiceDto.invoiceDate) : pickupDateTo;
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
          pickupDateFrom,
          pickupDateTo,
          invoiceDate,
          dueDate,
          billingType: generateInvoiceDto.billingType,
          createdBy,
        });
        success.push(invoice);
      } catch (error: any) {
        failed.push({
          hcfId,
          hcfCode,
          reason: error.message || 'Failed to generate invoice',
        });
      }
    }

    return { success, failed };
  }

  private async generateInvoiceForHcf(params: {
    companyId: string;
    hcfId: string;
    hcfCode: string;
    pickupDateFrom: Date;
    pickupDateTo: Date;
    invoiceDate: Date;
    dueDate: Date;
    billingType: BillingType;
    createdBy?: string;
  }): Promise<Invoice> {
    // Get HCF details
    const hcf = await this.hcfRepository.findById(params.hcfId);
    if (!hcf) {
      throw new MissingHcfBillingDataException(params.hcfCode, 'HCF not found');
    }

    // Check if kgRate is available
    const kgRate = hcf.kgRate ? parseFloat(hcf.kgRate) : null;
    if (!kgRate || kgRate <= 0) {
      throw new MissingHcfBillingDataException(params.hcfCode, 'Kg rate is not configured for this HCF');
    }

    // Get waste transactions for the period
    const allTransactions = await this.wasteTransactionRepository.findAll();
    const transactions = allTransactions.filter(t => 
      t.companyId === params.companyId &&
      t.hcfId === params.hcfId &&
      t.pickupDate >= params.pickupDateFrom &&
      t.pickupDate <= params.pickupDateTo &&
      t.status === 'Verified' // Only count verified transactions
    );

    if (transactions.length === 0) {
      throw new MissingHcfBillingDataException(params.hcfCode, 'No verified waste transactions found for the period');
    }

    // Sum all weights (Yellow, Red, Blue, White)
    let totalWeight = 0;
    for (const transaction of transactions) {
      if (transaction.yellowWeightKg) totalWeight += Number(transaction.yellowWeightKg);
      if (transaction.redWeightKg) totalWeight += Number(transaction.redWeightKg);
      if (transaction.blueWeightKg) totalWeight += Number(transaction.blueWeightKg);
      if (transaction.whiteWeightKg) totalWeight += Number(transaction.whiteWeightKg);
    }

    if (totalWeight <= 0) {
      throw new MissingHcfBillingDataException(params.hcfCode, 'Total weight is zero or negative');
    }

    // Calculate billing period (use pickup date range)
    const billingPeriodStart = params.pickupDateFrom;
    const billingPeriodEnd = params.pickupDateTo;

    // Check for duplicate invoice
    const existingInvoice = await this.invoiceRepository.findDuplicateInvoice({
      companyId: params.companyId,
      hcfId: params.hcfId,
      billingPeriodStart,
      billingPeriodEnd,
      billingType: params.billingType,
    });

    if (existingInvoice) {
      throw new DuplicateInvoiceException(
        `Invoice already exists for HCF ${params.hcfCode} for the period ${billingPeriodStart.toISOString().split('T')[0]} to ${billingPeriodEnd.toISOString().split('T')[0]}`
      );
    }

    // Calculate invoice amounts using weight-wise billing
    const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
      billingOption: BillingOption.WEIGHT_WISE,
      weightInKg: totalWeight,
      kgRate: kgRate,
      isInterState: false, // TODO: Determine from company/HCF state codes
      gstRate: 18, // TODO: Get from company settings
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
      billingDays: Math.ceil((params.pickupDateTo.getTime() - params.pickupDateFrom.getTime()) / (1000 * 60 * 60 * 24)),
      billingOption: BillingOption.WEIGHT_WISE,
      generationType: InvoiceGenerationType.AUTO,
      weightInKg: totalWeight,
      kgRate: kgRate,
      taxableValue: calculationResult.taxableValue,
      igst: calculationResult.igst,
      cgst: calculationResult.cgst,
      sgst: calculationResult.sgst,
      roundOff: calculationResult.roundOff,
      invoiceValue: calculationResult.invoiceValue,
      financialYear,
      sequenceNumber,
      billingPeriodStart,
      billingPeriodEnd,
      notes: `Auto-generated invoice (Weight-based) for period ${billingPeriodStart.toISOString().split('T')[0]} to ${billingPeriodEnd.toISOString().split('T')[0]}. Total weight: ${totalWeight.toFixed(2)} kg`,
      createdBy: params.createdBy || null,
    });

    // Same lifecycle as manual post: DUE + postedAt
    invoice.post();
    this.invoiceLockService.checkAndLockInvoice(invoice);

    const savedInvoice = await this.invoiceRepository.create(invoice);
    return savedInvoice;
  }
}
