import { BillingOption } from '../../infrastructure/transaction/invoice.entity';

/**
 * Pure helpers for manual invoice GST: company master rate, place-of-supply split (CGST/SGST vs IGST).
 */

/** Default GST % when company master has no rate configured. */
export const DEFAULT_GST_RATE_PERCENT = 18;

/**
 * Parse gst_rate from company master (stored as varchar). Accepts "18", "18%", "18.5", etc.
 */
export function parseCompanyGstRatePercent(raw: string | null | undefined): number {
  if (raw == null || String(raw).trim() === '') {
    return DEFAULT_GST_RATE_PERCENT;
  }
  const n = parseFloat(String(raw).replace(/%/g, '').trim());
  if (Number.isNaN(n) || n < 0) {
    return DEFAULT_GST_RATE_PERCENT;
  }
  return n;
}

/**
 * Normalize state code for comparison (e.g. "mh", " MH " -> "MH").
 */
export function normalizeStateToken(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
}

/**
 * Indian GSTIN: first two characters are the state code (numeric string, e.g. "27" for Maharashtra).
 */
export function extractStateCodeFromGstin(gstin: string | null | undefined): string | null {
  if (!gstin || typeof gstin !== 'string') return null;
  const g = gstin.trim().toUpperCase();
  if (g.length < 2) return null;
  const a = g[0];
  const b = g[1];
  if (a >= '0' && a <= '9' && b >= '0' && b <= '9') {
    return `${a}${b}`;
  }
  return null;
}

/**
 * Resolve company's state code for comparison with HCF.stateCode.
 * Prefers GSTIN prefix; falls back to normalized free-text state field.
 */
export function resolveCompanyStateCodeForSupply(
  gstin: string | null | undefined,
  stateLabel: string | null | undefined,
): string | null {
  const fromGstin = extractStateCodeFromGstin(gstin);
  if (fromGstin) return fromGstin;
  const s = normalizeStateToken(stateLabel);
  return s.length > 0 ? s : null;
}

/**
 * True when supply should be treated as inter-state (IGST full).
 * When either side is unknown, defaults to intra-state (CGST+SGST) to avoid overstating IGST.
 */
export function isInterStateSupply(
  companyGstin: string | null | undefined,
  companyState: string | null | undefined,
  hcfStateCode: string | null | undefined,
): boolean {
  const companyCode = resolveCompanyStateCodeForSupply(companyGstin, companyState);
  const hcfCode = normalizeStateToken(hcfStateCode);
  if (!companyCode || !hcfCode) {
    return false;
  }
  return companyCode !== hcfCode;
}

/**
 * Split total GST amount into IGST or CGST+SGST halves per place of supply.
 */
export function splitGstTaxAmount(
  totalGstAmount: number,
  isInterState: boolean,
): { igst: number; cgst: number; sgst: number } {
  if (totalGstAmount <= 0) {
    return { igst: 0, cgst: 0, sgst: 0 };
  }
  if (isInterState) {
    return { igst: totalGstAmount, cgst: 0, sgst: 0 };
  }
  const half = totalGstAmount / 2;
  return { igst: 0, cgst: half, sgst: half };
}

/**
 * Map HCF master billing_option text to invoice BillingOption enum.
 */
export function billingOptionFromHcfMaster(hcfBillingOption: string | null | undefined): BillingOption | null {
  if (hcfBillingOption == null || String(hcfBillingOption).trim() === '') {
    return null;
  }
  const raw = String(hcfBillingOption).trim();
  const key = raw.toLowerCase();

  if (key === 'bed-wise' || key === 'per bed' || key.includes('bed')) {
    return BillingOption.BED_WISE;
  }
  if (key === 'weight-wise' || key === 'per kg' || key.includes('kg') || key.includes('weight')) {
    return BillingOption.WEIGHT_WISE;
  }
  if (key === 'lumpsum' || key.includes('lump')) {
    return BillingOption.LUMPSUM;
  }

  // Exact enum values from invoice entity
  if (raw === BillingOption.BED_WISE) return BillingOption.BED_WISE;
  if (raw === BillingOption.WEIGHT_WISE) return BillingOption.WEIGHT_WISE;
  if (raw === BillingOption.LUMPSUM) return BillingOption.LUMPSUM;

  return null;
}
