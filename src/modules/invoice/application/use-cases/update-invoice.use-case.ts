import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoiceCalculationService } from '../services/invoice-calculation.service';
import { InvoiceNotFoundException, InvoiceLockedException, InvalidInvoiceDataException } from '../../domain/exceptions/invoice.exceptions';
import { BillingOption } from '../../infrastructure/transaction/invoice.entity';

@Injectable()
export class UpdateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceCalculationService: InvoiceCalculationService,
  ) {}

  async execute(invoiceId: string, updateInvoiceDto: UpdateInvoiceDto, modifiedBy?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }

    if (invoice.isLocked) {
      throw new InvoiceLockedException('Invoice is locked and cannot be modified');
    }

    // Validate billing data if billing option is being updated
    if (updateInvoiceDto.billingOption) {
      this.validateBillingData(updateInvoiceDto);
    }

    // Calculate new amounts if billing fields are updated
    let calculationResult = null;
    if (
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
        weightInKg: updateInvoiceDto.weightInKg ?? invoice.weightInKg,
        kgRate: updateInvoiceDto.kgRate ?? invoice.kgRate,
        lumpsumAmount: updateInvoiceDto.lumpsumAmount ?? invoice.lumpsumAmount,
        isGSTExempt: false, // TODO: Get from HCF
        isInterState: false, // TODO: Determine based on company and HCF state
      });
    }

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
      taxableValue: updateInvoiceDto.taxableValue ?? calculationResult?.taxableValue,
      igst: updateInvoiceDto.igst ?? calculationResult?.igst,
      cgst: updateInvoiceDto.cgst ?? calculationResult?.cgst,
      sgst: updateInvoiceDto.sgst ?? calculationResult?.sgst,
      roundOff: updateInvoiceDto.roundOff ?? calculationResult?.roundOff,
      invoiceValue: updateInvoiceDto.invoiceValue ?? calculationResult?.invoiceValue,
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
