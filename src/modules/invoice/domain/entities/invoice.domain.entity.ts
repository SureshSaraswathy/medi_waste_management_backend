import { InvoiceStatus, BillingType, BillingOption, InvoiceGenerationType } from '../../infrastructure/transaction/invoice.entity';

export class Invoice {
  constructor(
    public readonly invoiceId: string,
    public readonly companyId: string,
    public readonly hcfId: string,
    public readonly invoiceNumber: string,
    public invoiceDate: Date,
    public dueDate: Date,
    public billingType: BillingType,
    public billingDays: number | null,
    public billingOption: BillingOption,
    public generationType: InvoiceGenerationType,
    public bedCount: number | null,
    public bedRate: number | null,
    public weightInKg: number | null,
    public kgRate: number | null,
    public lumpsumAmount: number | null,
    public taxableValue: number,
    public igst: number,
    public cgst: number,
    public sgst: number,
    public roundOff: number,
    public invoiceValue: number,
    public totalPaidAmount: number,
    public balanceAmount: number,
    public status: InvoiceStatus,
    public batchId: string | null,
    public postedAt: Date | null,
    public isLocked: boolean,
    public lockedAfterDate: Date | null,
    public financialYear: string,
    public sequenceNumber: number,
    public billingPeriodStart: Date | null,
    public billingPeriodEnd: Date | null,
    public notes: string | null,
    public createdBy: string | null,
    public createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  static create(params: {
    invoiceId: string;
    companyId: string;
    hcfId: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    billingType: BillingType;
    billingDays?: number | null;
    billingOption: BillingOption;
    generationType?: InvoiceGenerationType;
    bedCount?: number | null;
    bedRate?: number | null;
    weightInKg?: number | null;
    kgRate?: number | null;
    lumpsumAmount?: number | null;
    taxableValue?: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
    roundOff?: number;
    invoiceValue?: number;
    financialYear: string;
    sequenceNumber: number;
    billingPeriodStart?: Date | null;
    billingPeriodEnd?: Date | null;
    notes?: string | null;
    createdBy?: string | null;
    batchId?: string | null;
    status?: InvoiceStatus;
    postedAt?: Date | null;
  }): Invoice {
    const now = new Date();
    const taxableValue = params.taxableValue ?? 0;
    const igst = params.igst ?? 0;
    const cgst = params.cgst ?? 0;
    const sgst = params.sgst ?? 0;
    const roundOff = params.roundOff ?? 0;
    const invoiceValue = params.invoiceValue ?? (taxableValue + igst + cgst + sgst + roundOff);

    return new Invoice(
      params.invoiceId,
      params.companyId,
      params.hcfId,
      params.invoiceNumber,
      params.invoiceDate,
      params.dueDate,
      params.billingType,
      params.billingDays ?? null,
      params.billingOption,
      params.generationType ?? InvoiceGenerationType.MANUAL,
      params.bedCount ?? null,
      params.bedRate ?? null,
      params.weightInKg ?? null,
      params.kgRate ?? null,
      params.lumpsumAmount ?? null,
      taxableValue,
      igst,
      cgst,
      sgst,
      roundOff,
      invoiceValue,
      0, // totalPaidAmount
      invoiceValue, // balanceAmount
      params.status ?? InvoiceStatus.DRAFT,
      params.batchId ?? null,
      params.postedAt ?? null,
      false, // isLocked
      null, // lockedAfterDate
      params.financialYear,
      params.sequenceNumber,
      params.billingPeriodStart ?? null,
      params.billingPeriodEnd ?? null,
      params.notes ?? null,
      params.createdBy ?? null,
      now,
      null,
      now,
      false,
    );
  }

  update(data: {
    invoiceDate?: Date;
    dueDate?: Date;
    billingType?: BillingType;
    billingDays?: number | null;
    billingOption?: BillingOption;
    bedCount?: number | null;
    bedRate?: number | null;
    weightInKg?: number | null;
    kgRate?: number | null;
    lumpsumAmount?: number | null;
    taxableValue?: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
    roundOff?: number;
    invoiceValue?: number;
    notes?: string | null;
    modifiedBy?: string | null;
  }): void {
    if (this.isLocked) {
      throw new Error('Invoice is locked and cannot be modified');
    }

    if (data.invoiceDate !== undefined) this.invoiceDate = data.invoiceDate;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.billingType !== undefined) this.billingType = data.billingType;
    if (data.billingDays !== undefined) this.billingDays = data.billingDays;
    if (data.billingOption !== undefined) this.billingOption = data.billingOption;
    if (data.bedCount !== undefined) this.bedCount = data.bedCount;
    if (data.bedRate !== undefined) this.bedRate = data.bedRate;
    if (data.weightInKg !== undefined) this.weightInKg = data.weightInKg;
    if (data.kgRate !== undefined) this.kgRate = data.kgRate;
    if (data.lumpsumAmount !== undefined) this.lumpsumAmount = data.lumpsumAmount;
    if (data.taxableValue !== undefined) this.taxableValue = data.taxableValue;
    if (data.igst !== undefined) this.igst = data.igst;
    if (data.cgst !== undefined) this.cgst = data.cgst;
    if (data.sgst !== undefined) this.sgst = data.sgst;
    if (data.roundOff !== undefined) this.roundOff = data.roundOff;
    if (data.invoiceValue !== undefined) {
      this.invoiceValue = data.invoiceValue;
      this.balanceAmount = data.invoiceValue - this.totalPaidAmount;
    } else if (
      data.taxableValue !== undefined ||
      data.igst !== undefined ||
      data.cgst !== undefined ||
      data.sgst !== undefined ||
      data.roundOff !== undefined
    ) {
      // Recalculate invoice value
      this.invoiceValue = this.taxableValue + this.igst + this.cgst + this.sgst + this.roundOff;
      this.balanceAmount = this.invoiceValue - this.totalPaidAmount;
    }
    if (data.notes !== undefined) this.notes = data.notes;
    this.modifiedBy = data.modifiedBy ?? null;
    this.modifiedOn = new Date();
  }

  lock(lockedAfterDate: Date): void {
    this.isLocked = true;
    this.lockedAfterDate = lockedAfterDate;
  }

  updatePayment(totalPaidAmount: number): void {
    this.totalPaidAmount = totalPaidAmount;
    this.balanceAmount = this.invoiceValue - totalPaidAmount;
    
    // Update status based on payment
    if (this.balanceAmount <= 0) {
      this.status = InvoiceStatus.PAID;
    } else if (this.totalPaidAmount > 0 && this.status === InvoiceStatus.DUE) {
      this.status = InvoiceStatus.PARTIAL_PAID;
    }
    
    this.modifiedOn = new Date();
  }

  generate(): void {
    if (this.status === InvoiceStatus.DRAFT) {
      this.status = InvoiceStatus.POSTED;
      this.postedAt = new Date();
      this.modifiedOn = new Date();
    }
  }

  post(): void {
    if (this.status === InvoiceStatus.DRAFT) {
      this.status = InvoiceStatus.DUE;
      this.postedAt = new Date();
      this.modifiedOn = new Date();
    }
  }

  cancel(): void {
    if (this.isLocked) {
      throw new Error('Locked invoice cannot be cancelled');
    }
    this.status = InvoiceStatus.CANCELLED;
    this.modifiedOn = new Date();
  }
}
