import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceGstCalculationService } from '../services/invoice-gst-calculation.service';
import { InvoiceNotFoundException, InvoiceLockedException, InvalidInvoiceDataException } from '../../domain/exceptions/invoice.exceptions';
import { BillingOption, InvoiceGenerationType, InvoiceStatus } from '../../infrastructure/transaction/invoice.entity';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';

@Injectable()
export class UpdateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly invoiceCalculationService: InvoiceCalculationService,
    private readonly invoiceGstCalculationService: InvoiceGstCalculationService,
  ) {}

  async execute(invoiceId: string, updateInvoiceDto: UpdateInvoiceDto, modifiedBy?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }

    if (invoice.isLocked) {
      throw new InvoiceLockedException('Invoice is locked and cannot be modified');
    }

    // Edit protection: Only DRAFT invoices can be edited
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new InvoiceLockedException('Posted invoices cannot be edited');
    }

    const companyEntity = await this.companyRepository.getEntityById(invoice.companyId);
    const hcf = await this.hcfRepository.findById(invoice.hcfId);

    // Validate billing data if billing option is being updated
    if (updateInvoiceDto.billingOption) {
      this.validateBillingData(updateInvoiceDto);
    }

    const isManualDraft = invoice.generationType === InvoiceGenerationType.MANUAL && invoice.status === InvoiceStatus.DRAFT;

    let calculationResult: ReturnType<InvoiceCalculationService['calculateInvoiceAmounts']> | null = null;

    if (isManualDraft) {
      const billingOption = updateInvoiceDto.billingOption ?? invoice.billingOption;
      const billingDays = updateInvoiceDto.billingDays !== undefined ? updateInvoiceDto.billingDays : invoice.billingDays;
      if (billingOption === BillingOption.BED_WISE && (!billingDays || billingDays < 1)) {
        throw new InvalidInvoiceDataException('Billing days is required and must be at least 1 for bed-wise manual invoices');
      }

      calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
        billingOption,
        bedCount: updateInvoiceDto.bedCount ?? invoice.bedCount,
        bedRate: updateInvoiceDto.bedRate ?? invoice.bedRate,
        billingDays,
        weightInKg: updateInvoiceDto.weightInKg ?? invoice.weightInKg,
        kgRate: updateInvoiceDto.kgRate ?? invoice.kgRate,
        lumpsumAmount: updateInvoiceDto.lumpsumAmount ?? invoice.lumpsumAmount,
        isGSTExempt: hcf?.isGSTExempt ?? false,
        isInterState: this.invoiceGstCalculationService.isInterStateFromMasters(companyEntity, hcf),
        gstRate: this.invoiceGstCalculationService.getGstRatePercentFromCompany(companyEntity),
      });
    } else if (
      updateInvoiceDto.bedCount !== undefined ||
      updateInvoiceDto.bedRate !== undefined ||
      updateInvoiceDto.weightInKg !== undefined ||
      updateInvoiceDto.kgRate !== undefined ||
      updateInvoiceDto.lumpsumAmount !== undefined
    ) {
      const billingOption = updateInvoiceDto.billingOption ?? invoice.billingOption;
      calculationResult = this.invoiceCalculationService.calculateInvoiceAmounts({
        billingOption,
        bedCount: updateInvoiceDto.bedCount ?? invoice.bedCount,
        bedRate: updateInvoiceDto.bedRate ?? invoice.bedRate,
        billingDays: updateInvoiceDto.billingDays ?? invoice.billingDays,
        weightInKg: updateInvoiceDto.weightInKg ?? invoice.weightInKg,
        kgRate: updateInvoiceDto.kgRate ?? invoice.kgRate,
        lumpsumAmount: updateInvoiceDto.lumpsumAmount ?? invoice.lumpsumAmount,
        isGSTExempt: false,
        isInterState: false,
      });
    }

    const useCalc = calculationResult !== null;

    // Update invoice
    invoice.update({
      invoiceDate: updateInvoiceDto.invoiceDate ? new Date(updateInvoiceDto.invoiceDate) : undefined,
      dueDate: updateInvoiceDto.dueDate ? new Date(updateInvoiceDto.dueDate) : undefined,
      billingType: updateInvoiceDto.billingType,
      billingDays: updateInvoiceDto.billingDays,
      billingOption: updateInvoiceDto.billingOption,
      bedCount: updateInvoiceDto.bedCount,
      bedRate: updateInvoiceDto.bedRate,
      weightInKg: updateInvoiceDto.weightInKg,
      kgRate: updateInvoiceDto.kgRate,
      lumpsumAmount: updateInvoiceDto.lumpsumAmount,
      taxableValue: useCalc ? calculationResult!.taxableValue : updateInvoiceDto.taxableValue,
      igst: useCalc ? calculationResult!.igst : updateInvoiceDto.igst,
      cgst: useCalc ? calculationResult!.cgst : updateInvoiceDto.cgst,
      sgst: useCalc ? calculationResult!.sgst : updateInvoiceDto.sgst,
      roundOff: useCalc ? calculationResult!.roundOff : updateInvoiceDto.roundOff,
      invoiceValue: useCalc ? calculationResult!.invoiceValue : updateInvoiceDto.invoiceValue,
      notes: updateInvoiceDto.notes,
      modifiedBy: modifiedBy || null,
    });

    return await this.invoiceRepository.update(invoice);
  }

  private validateBillingData(dto: UpdateInvoiceDto): void {
    if (!dto.billingOption) return;

    switch (dto.billingOption) {
      case BillingOption.BED_WISE:
        if (dto.bedCount !== undefined && dto.bedCount <= 0) {
          throw new InvalidInvoiceDataException('Bed count must be greater than 0 for bed-wise billing');
        }
        if (dto.bedRate !== undefined && dto.bedRate <= 0) {
          throw new InvalidInvoiceDataException('Bed rate must be greater than 0 for bed-wise billing');
        }
        break;

      case BillingOption.WEIGHT_WISE:
        if (dto.weightInKg !== undefined && dto.weightInKg <= 0) {
          throw new InvalidInvoiceDataException('Weight in kg must be greater than 0 for weight-wise billing');
        }
        if (dto.kgRate !== undefined && dto.kgRate <= 0) {
          throw new InvalidInvoiceDataException('Kg rate must be greater than 0 for weight-wise billing');
        }
        break;

      case BillingOption.LUMPSUM:
        if (dto.lumpsumAmount !== undefined && dto.lumpsumAmount <= 0) {
          throw new InvalidInvoiceDataException('Lumpsum amount must be greater than 0 for lumpsum billing');
        }
        break;
    }
  }
}
