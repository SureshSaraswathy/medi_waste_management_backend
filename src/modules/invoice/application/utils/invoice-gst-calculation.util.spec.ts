import {
  parseCompanyGstRatePercent,
  DEFAULT_GST_RATE_PERCENT,
  isInterStateSupply,
  splitGstTaxAmount,
  billingOptionFromHcfMaster,
} from './invoice-gst-calculation.util';
import { BillingOption } from '../../infrastructure/transaction/invoice.entity';

describe('invoice-gst-calculation.util', () => {
  describe('parseCompanyGstRatePercent', () => {
    it('returns default when empty', () => {
      expect(parseCompanyGstRatePercent(null)).toBe(DEFAULT_GST_RATE_PERCENT);
      expect(parseCompanyGstRatePercent(undefined)).toBe(DEFAULT_GST_RATE_PERCENT);
      expect(parseCompanyGstRatePercent('')).toBe(DEFAULT_GST_RATE_PERCENT);
    });
    it('parses numeric strings and strips %', () => {
      expect(parseCompanyGstRatePercent('18')).toBe(18);
      expect(parseCompanyGstRatePercent('18%')).toBe(18);
      expect(parseCompanyGstRatePercent(' 12.5 ')).toBe(12.5);
    });
  });

  describe('isInterStateSupply', () => {
    it('is false when HCF state matches GSTIN state code', () => {
      expect(isInterStateSupply('27AAAAA0000A1Z5', null, '27')).toBe(false);
    });
    it('is true when HCF state differs from GSTIN state code', () => {
      expect(isInterStateSupply('27AAAAA0000A1Z5', null, '09')).toBe(true);
    });
    it('falls back to company state label when no GSTIN code', () => {
      expect(isInterStateSupply(null, '27', '27')).toBe(false);
      expect(isInterStateSupply(null, '27', '09')).toBe(true);
    });
    it('defaults to intra-state when comparison not possible', () => {
      expect(isInterStateSupply(null, null, '27')).toBe(false);
      expect(isInterStateSupply('BAD', null, '27')).toBe(false);
    });
  });

  describe('splitGstTaxAmount', () => {
    it('splits into CGST/SGST for intra-state', () => {
      const r = splitGstTaxAmount(180, false);
      expect(r.igst).toBe(0);
      expect(r.cgst).toBe(90);
      expect(r.sgst).toBe(90);
    });
    it('assigns full amount to IGST for inter-state', () => {
      const r = splitGstTaxAmount(180, true);
      expect(r.igst).toBe(180);
      expect(r.cgst).toBe(0);
      expect(r.sgst).toBe(0);
    });
  });

  describe('billingOptionFromHcfMaster', () => {
    it('maps common HCF master labels', () => {
      expect(billingOptionFromHcfMaster('Per Bed')).toBe(BillingOption.BED_WISE);
      expect(billingOptionFromHcfMaster('Per Kg')).toBe(BillingOption.WEIGHT_WISE);
      expect(billingOptionFromHcfMaster('Lumpsum')).toBe(BillingOption.LUMPSUM);
    });
  });
});
