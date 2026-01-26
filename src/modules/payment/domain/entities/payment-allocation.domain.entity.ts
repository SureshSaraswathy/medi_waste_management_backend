/**
 * Payment Allocation Entity
 * Tracks how much of a payment is allocated to each invoice (FIFO allocation)
 */
export class PaymentAllocation {
  constructor(
    public readonly allocationId: string,
    public readonly paymentId: string,
    public readonly invoiceId: string,
    public readonly allocatedAmount: number,
    public readonly allocationDate: Date,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    allocationId: string;
    paymentId: string;
    invoiceId: string;
    allocatedAmount: number;
    createdBy?: string | null;
  }): PaymentAllocation {
    const now = new Date();
    return new PaymentAllocation(
      params.allocationId,
      params.paymentId,
      params.invoiceId,
      params.allocatedAmount,
      now,
      params.createdBy ?? null,
      now,
      false,
    );
  }

  static reconstitute(params: {
    allocationId: string;
    paymentId: string;
    invoiceId: string;
    allocatedAmount: number;
    allocationDate: Date;
    createdBy: string | null;
    createdOn: Date;
    isDeleted: boolean;
  }): PaymentAllocation {
    return new PaymentAllocation(
      params.allocationId,
      params.paymentId,
      params.invoiceId,
      params.allocatedAmount,
      params.allocationDate,
      params.createdBy,
      params.createdOn,
      params.isDeleted,
    );
  }
}
