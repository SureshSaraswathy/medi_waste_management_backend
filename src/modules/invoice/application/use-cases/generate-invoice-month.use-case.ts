import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../../waste-transaction/domain/interfaces/waste-transaction.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { GenerateInvoiceMonthDto, InvoiceGenerationMode } from '../dto/generate-invoice-month.dto';
import { InvoiceNumberService } from '../services/invoice-number.service';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceLockService } from '../services/invoice-lock.service';
import { DuplicateInvoiceException, MissingHcfBillingDataException } from '../../domain/exceptions/invoice.exceptions';
import { BillingOption, InvoiceGenerationType, BillingType } from '../../infrastructure/transaction/invoice.entity';
import { randomUUID } from 'crypto';

interface AutoGenerationResult {
  success: Invoice[];
  failed: Array<{ hcfId: string; hcfCode: string; reason: string }>;
  skipped: Array<{ hcfId: string; hcfCode: string; reason: string }>;
}

@Injectable()
export class GenerateInvoiceMonthUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceLockService: InvoiceLockService,
  ) {}

  async execute(generateInvoiceDto: GenerateInvoiceMonthDto, createdBy?: string): Promise<AutoGenerationResult> {
    // Validate month/year - only previous month allowed
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    if (generateInvoiceDto.month !== previousMonth || generateInvoiceDto.year !== previousYear) {
      throw new BadRequestException(
        `Only previous month (${previousMonth}/${previousYear}) can be selected for invoice generation`
      );
    }

    // Calculate billing period (first and last day of selected month)
    const billingPeriodStart = new Date(generateInvoiceDto.year, generateInvoiceDto.month - 1, 1);
    const billingPeriodEnd = new Date(generateInvoiceDto.year, generateInvoiceDto.month, 0); // Last day of month
    const invoiceDate = new Date(generateInvoiceDto.invoiceDate);
    const dueDays = generateInvoiceDto.dueDays ?? 30;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Get company details for prefix
    const company = await this.companyRepository.findById(generateInvoiceDto.companyId);
    if (!company) {
      throw new BadRequestException('Company not found');
    }
    const companyPrefix = company.companyCode || 'INV';

    // Get all active HCFs for the company with AutoGeneration = TRUE
    const allHcfs = await this.hcfRepository.findByCompany(generateInvoiceDto.companyId);
    const activeHcfs = allHcfs.filter(hcf => hcf.status === 'Active' && !hcf.isDeleted);
    const hcfsToProcess = activeHcfs
      .filter(hcf => hcf.autoGen === true)
      .map(hcf => ({ hcfId: hcf.hcfId, hcfCode: hcf.hcfCode }));

    if (hcfsToProcess.length === 0) {
      const totalActiveHcfs = activeHcfs.length;
      const autoGenEnabledCount = activeHcfs.filter(hcf => hcf.autoGen === true).length;
      throw new BadRequestException(
        `No HCFs found with AutoGeneration enabled for this company. ` +
        `Total active HCFs: ${totalActiveHcfs}, ` +
        `AutoGeneration enabled: ${autoGenEnabledCount}. ` +
        `Please enable AutoGeneration flag in HCF Master for the HCFs you want to include.`
      );
    }

    const success: Invoice[] = [];
    const failed: Array<{ hcfId: string; hcfCode: string; reason: string }> = [];
    const skipped: Array<{ hcfId: string; hcfCode: string; reason: string }> = [];

    // Process each HCF
    for (const { hcfId, hcfCode } of hcfsToProcess) {
      try {
        // Check for duplicate invoice
        const existingInvoice = await this.invoiceRepository.findDuplicateInvoice({
          companyId: generateInvoiceDto.companyId,
          hcfId,
          billingPeriodStart,
          billingPeriodEnd,
          billingType: BillingType.MONTHLY,
        });

        if (existingInvoice) {
          skipped.push({
            hcfId,
            hcfCode,
            reason: 'Invoice already exists for this period',
          });
          continue;
        }

        const invoice = await this.generateInvoiceForHcf({
          companyId: generateInvoiceDto.companyId,
          companyPrefix,
          hcfId,
          hcfCode,
          billingPeriodStart,
          billingPeriodEnd,
          invoiceDate,
          dueDate,
          generationMode: generateInvoiceDto.generationMode,
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

    return { success, failed, skipped };
  }

  private async generateInvoiceForHcf(params: {
    companyId: string;
    companyPrefix: string;
    hcfId: string;
    hcfCode: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    invoiceDate: Date;
    dueDate: Date;
    generationMode: InvoiceGenerationMode;
    createdBy?: string;
  }): Promise<Invoice> {
    // Get HCF details
    const hcf = await this.hcfRepository.findById(params.hcfId);
    if (!hcf) {
      throw new MissingHcfBillingDataException(params.hcfCode, 'HCF not found');
    }

    let billingOption: BillingOption;
    let bedCount: number | null = null;
    let bedRate: number | null = null;
    let weightInKg: number | null = null;
    let kgRate: number | null = null;
    let lumpsumAmount: number | null = null;
    let taxableValue: number;
    let igst: number;
    let cgst: number;
    let sgst: number;
    let roundOff: number;
    let invoiceValue: number;

    if (params.generationMode === InvoiceGenerationMode.BED_LUMPSUM) {
      // Bed-wise or Lumpsum generation
      if (hcf.billingOption?.toLowerCase().includes('bed')) {
        // Bed-wise billing
        billingOption = BillingOption.BED_WISE;
        bedCount = hcf.bedCount ? parseInt(hcf.bedCount, 10) : null;
        bedRate = hcf.bedRate ? parseFloat(hcf.bedRate) : null;

        if (!bedCount || !bedRate) {
          throw new MissingHcfBillingDataException(
            params.hcfCode,
            'Bed count or bed rate is missing for bed-wise billing'
          );
        }

        // Calculate: NoOfDays × NoOfBeds × BedRate
        const daysInMonth = this.getDaysInMonth(params.billingPeriodStart);
        const amount = daysInMonth * bedCount * bedRate;

        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.BED_WISE,
          bedCount,
          bedRate,
          daysInMonth,
          isInterState: false, // TODO: Determine from company/HCF state codes
          gstRate: 18, // TODO: Get from company settings
        });

        taxableValue = calculationResult.taxableValue;
        igst = calculationResult.igst;
        cgst = calculationResult.cgst;
        sgst = calculationResult.sgst;
        roundOff = calculationResult.roundOff;
        invoiceValue = calculationResult.invoiceValue;
      } else if (hcf.billingOption?.toLowerCase().includes('lumpsum')) {
        // Lumpsum billing
        billingOption = BillingOption.LUMPSUM;
        lumpsumAmount = hcf.lumpsum ? parseFloat(hcf.lumpsum) : null;

        if (!lumpsumAmount) {
          throw new MissingHcfBillingDataException(
            params.hcfCode,
            'Lumpsum amount is missing for lumpsum billing'
          );
        }

        const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
          billingOption: BillingOption.LUMPSUM,
          lumpsumAmount,
          isInterState: false,
          gstRate: 18,
        });

        taxableValue = calculationResult.taxableValue;
        igst = calculationResult.igst;
        cgst = calculationResult.cgst;
        sgst = calculationResult.sgst;
        roundOff = calculationResult.roundOff;
        invoiceValue = calculationResult.invoiceValue;
      } else {
        throw new MissingHcfBillingDataException(
          params.hcfCode,
          'HCF billing option is not configured for Bed-wise or Lumpsum'
        );
      }
    } else {
      // Weight-based generation
      billingOption = BillingOption.WEIGHT_WISE;
      kgRate = hcf.kgRate ? parseFloat(hcf.kgRate) : null;

      if (!kgRate || kgRate <= 0) {
        throw new MissingHcfBillingDataException(
          params.hcfCode,
          'Kg rate is not configured for this HCF'
        );
      }

      // Get waste transactions for the period
      const transactions = await this.wasteTransactionRepository.findVerifiedTransactionsByHcfAndDateRange(
        params.hcfId,
        params.billingPeriodStart,
        params.billingPeriodEnd,
      );

      if (transactions.length === 0) {
        throw new MissingHcfBillingDataException(
          params.hcfCode,
          'No verified waste transactions found for the period'
        );
      }

      // Sum all weights (Yellow, Red, Blue, White)
      let totalWeight = 0;
      for (const transaction of transactions) {
        if (transaction.yellowWeightKg) totalWeight += Number(transaction.yellowWeightKg);
        if (transaction.redWeightKg) totalWeight += Number(transaction.redWeightKg);
        if (transaction.whiteWeightKg) totalWeight += Number(transaction.whiteWeightKg);
        if (transaction.blueWeightKg) totalWeight += Number(transaction.blueWeightKg);
      }

      if (totalWeight <= 0) {
        throw new MissingHcfBillingDataException(
          params.hcfCode,
          'Total weight is zero or negative'
        );
      }

      weightInKg = totalWeight;

      const calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
        billingOption: BillingOption.WEIGHT_WISE,
        weightInKg: totalWeight,
        kgRate: kgRate,
        isInterState: false,
        gstRate: 18,
      });

      taxableValue = calculationResult.taxableValue;
      igst = calculationResult.igst;
      cgst = calculationResult.cgst;
      sgst = calculationResult.sgst;
      roundOff = calculationResult.roundOff;
      invoiceValue = calculationResult.invoiceValue;
    }

    // Generate invoice number with company prefix
    const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(
      params.invoiceDate,
      params.companyPrefix,
    );

    // Create and save invoice
    const newInvoice = Invoice.create({
      invoiceId: randomUUID(),
      companyId: params.companyId,
      hcfId: params.hcfId,
      invoiceNumber,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      billingType: BillingType.MONTHLY,
      billingOption,
      generationType: InvoiceGenerationType.AUTO,
      bedCount,
      bedRate,
      weightInKg,
      kgRate,
      lumpsumAmount,
      taxableValue,
      igst,
      cgst,
      sgst,
      roundOff,
      invoiceValue,
      financialYear,
      sequenceNumber,
      billingPeriodStart: params.billingPeriodStart,
      billingPeriodEnd: params.billingPeriodEnd,
      notes: `Auto-generated ${params.generationMode} invoice for ${params.billingPeriodStart.toISOString().split('T')[0]} to ${params.billingPeriodEnd.toISOString().split('T')[0]}`,
      createdBy: params.createdBy,
    });

    return await this.invoiceRepository.create(newInvoice);
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}
