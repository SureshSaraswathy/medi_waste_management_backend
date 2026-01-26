export enum PaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum PaymentMode {
  CASH = 'Cash',
  CHEQUE = 'Cheque',
  BANK_TRANSFER = 'Bank Transfer',
  UPI = 'UPI',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  OTHER = 'Other',
}

export class Payment {
  constructor(
    public readonly paymentId: string,
    public readonly companyId: string,
    public readonly paymentDate: Date,
    public readonly paymentAmount: number,
    public readonly paymentMode: PaymentMode,
    public readonly referenceNumber: string | null,
    public readonly bankName: string | null,
    public readonly chequeNumber: string | null,
    public readonly chequeDate: Date | null,
    public status: PaymentStatus,
    public readonly notes: string | null,
    public readonly receiptId: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    paymentId: string;
    companyId: string;
    paymentDate: Date;
    paymentAmount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string | null;
    bankName?: string | null;
    chequeNumber?: string | null;
    chequeDate?: Date | null;
    notes?: string | null;
    createdBy?: string | null;
  }): Payment {
    const now = new Date();
    return new Payment(
      params.paymentId,
      params.companyId,
      params.paymentDate,
      params.paymentAmount,
      params.paymentMode,
      params.referenceNumber ?? null,
      params.bankName ?? null,
      params.chequeNumber ?? null,
      params.chequeDate ?? null,
      PaymentStatus.PENDING,
      params.notes ?? null,
      null, // receiptId - will be set after receipt generation
      params.createdBy ?? null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(params: {
    paymentId: string;
    companyId: string;
    paymentDate: Date;
    paymentAmount: number;
    paymentMode: PaymentMode;
    referenceNumber: string | null;
    bankName: string | null;
    chequeNumber: string | null;
    chequeDate: Date | null;
    status: PaymentStatus;
    notes: string | null;
    receiptId: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Payment {
    return new Payment(
      params.paymentId,
      params.companyId,
      params.paymentDate,
      params.paymentAmount,
      params.paymentMode,
      params.referenceNumber,
      params.bankName,
      params.chequeNumber,
      params.chequeDate,
      params.status,
      params.notes,
      params.receiptId,
      params.createdBy,
      params.createdOn,
      params.modifiedBy,
      params.modifiedOn,
      params.isDeleted,
    );
  }

  complete(receiptId: string, modifiedBy?: string | null): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be completed');
    }
    this.status = PaymentStatus.COMPLETED;
    (this as any).receiptId = receiptId;
    this.modifiedBy = modifiedBy ?? null;
    this.modifiedOn = new Date();
  }

  cancel(modifiedBy?: string | null): void {
    if (this.status === PaymentStatus.COMPLETED) {
      throw new Error('Completed payments cannot be cancelled');
    }
    this.status = PaymentStatus.CANCELLED;
    this.modifiedBy = modifiedBy ?? null;
    this.modifiedOn = new Date();
  }
}
