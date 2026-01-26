/**
 * Receipt Invoice Mapping Entity
 * Maps receipts to invoices (many-to-many relationship)
 * One receipt can cover multiple invoices, one invoice can be paid by multiple receipts
 */
export class ReceiptInvoiceMapping {
  constructor(
    public readonly mappingId: string,
    public readonly receiptId: string,
    public readonly invoiceId: string,
    public readonly allocatedAmount: number,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    mappingId: string;
    receiptId: string;
    invoiceId: string;
    allocatedAmount: number;
    createdBy?: string | null;
  }): ReceiptInvoiceMapping {
    const now = new Date();
    return new ReceiptInvoiceMapping(
      params.mappingId,
      params.receiptId,
      params.invoiceId,
      params.allocatedAmount,
      params.createdBy ?? null,
      now,
      false,
    );
  }

  static reconstitute(params: {
    mappingId: string;
    receiptId: string;
    invoiceId: string;
    allocatedAmount: number;
    createdBy: string | null;
    createdOn: Date;
    isDeleted: boolean;
  }): ReceiptInvoiceMapping {
    return new ReceiptInvoiceMapping(
      params.mappingId,
      params.receiptId,
      params.invoiceId,
      params.allocatedAmount,
      params.createdBy,
      params.createdOn,
      params.isDeleted,
    );
  }
}
