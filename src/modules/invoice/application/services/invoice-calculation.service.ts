import { Injectable } from '@nestjs/common';
import { BillingOption } from '../../infrastructure/transaction/invoice.entity';

export interface BillingCalculationResult {
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  invoiceValue: number;
}

@Injectable()
export class InvoiceCalculationService {
  /**
   * Calculate invoice amounts based on billing option
   */
  calculateInvoiceAmounts(params: {
    billingOption: BillingOption;
    bedCount?: number | null;
    bedRate?: number | null;
    daysInMonth?: number; // For bed-wise monthly calculation
    weightInKg?: number | null;
    kgRate?: number | null;
    lumpsumAmount?: number | null;
    gstRate?: number; // Default 18%
    isGSTExempt?: boolean;
    isInterState?: boolean; // For IGST vs CGST+SGST
  }): BillingCalculationResult {
    let taxableValue = 0;

    // Calculate taxable value based on billing option
    switch (params.billingOption) {
      case BillingOption.BED_WISE:
        if (!params.bedCount || !params.bedRate) {
          throw new Error('Bed count and bed rate are required for bed-wise billing');
        }
        // If daysInMonth is provided, use it; otherwise default to 30 days
        const days = params.daysInMonth ?? 30;
        taxableValue = days * params.bedCount * params.bedRate;
        break;

      case BillingOption.WEIGHT_WISE:
        if (!params.weightInKg || !params.kgRate) {
          throw new Error('Weight and kg rate are required for weight-wise billing');
        }
        taxableValue = params.weightInKg * params.kgRate;
        break;

      case BillingOption.LUMPSUM:
        if (!params.lumpsumAmount) {
          throw new Error('Lumpsum amount is required for lumpsum billing');
        }
        taxableValue = params.lumpsumAmount;
        break;
    }

    // Calculate taxes
    const gstRate = params.gstRate ?? 18; // Default 18%
    let igst = 0;
    let cgst = 0;
    let sgst = 0;

    if (!params.isGSTExempt && taxableValue > 0) {
      const taxAmount = (taxableValue * gstRate) / 100;

      if (params.isInterState) {
        // Inter-state: IGST
        igst = taxAmount;
      } else {
        // Intra-state: CGST + SGST (9% each)
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
      }
    }

    // Calculate total and round off
    const totalBeforeRoundOff = taxableValue + igst + cgst + sgst;
    const invoiceValue = Math.round(totalBeforeRoundOff);
    const roundOff = invoiceValue - totalBeforeRoundOff;

    return {
      taxableValue: Math.round(taxableValue * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      roundOff: Math.round(roundOff * 100) / 100,
      invoiceValue,
    };
  }
}
