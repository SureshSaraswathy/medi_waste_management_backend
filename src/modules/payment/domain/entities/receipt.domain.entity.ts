export class Receipt {
  constructor(
    public readonly receiptId: string,
    public readonly companyId: string,
    public readonly receiptNumber: string,
    public readonly receiptDate: Date,
    public readonly totalAmount: number,
    public readonly paymentId: string,
    public readonly notes: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    receiptId: string;
    companyId: string;
    receiptNumber: string;
    receiptDate: Date;
    totalAmount: number;
    paymentId: string;
    notes?: string | null;
    createdBy?: string | null;
  }): Receipt {
    const now = new Date();
    return new Receipt(
      params.receiptId,
      params.companyId,
      params.receiptNumber,
      params.receiptDate,
      params.totalAmount,
      params.paymentId,
      params.notes ?? null,
      params.createdBy ?? null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(params: {
    receiptId: string;
    companyId: string;
    receiptNumber: string;
    receiptDate: Date;
    totalAmount: number;
    paymentId: string;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Receipt {
    return new Receipt(
      params.receiptId,
      params.companyId,
      params.receiptNumber,
      params.receiptDate,
      params.totalAmount,
      params.paymentId,
      params.notes,
      params.createdBy,
      params.createdOn,
      params.modifiedBy,
      params.modifiedOn,
      params.isDeleted,
    );
  }
}
