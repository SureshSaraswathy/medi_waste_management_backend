import { Injectable } from '@nestjs/common';
import {
  parseCompanyGstRatePercent,
  isInterStateSupply,
} from '../utils/invoice-gst-calculation.util';

/**
 * Resolves GST rate and place-of-supply (inter vs intra state) from Company + HCF master data.
 * Used by manual invoice create/update so tax matches company GST % and state rules.
 */
export type CompanyGstEntitySlice = {
  gstin?: string | null;
  state?: string | null;
  gstRate?: string | null;
};

export type HcfGstSlice = {
  stateCode?: string | null;
};

@Injectable()
export class InvoiceGstCalculationService {
  /**
   * GST % from company master (defaults when missing).
   */
  getGstRatePercentFromCompany(companyEntity: CompanyGstEntitySlice | null | undefined): number {
    return parseCompanyGstRatePercent(companyEntity?.gstRate);
  }

  /**
   * Inter-state when company place of supply state differs from HCF state code.
   */
  isInterStateFromMasters(
    companyEntity: CompanyGstEntitySlice | null | undefined,
    hcf: HcfGstSlice | null | undefined,
  ): boolean {
    return isInterStateSupply(
      companyEntity?.gstin ?? null,
      companyEntity?.state ?? null,
      hcf?.stateCode ?? null,
    );
  }
}
