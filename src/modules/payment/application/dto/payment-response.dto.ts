import { PaymentStatus, PaymentMode } from '../../domain/entities/payment.domain.entity';

export class PaymentAllocationResponseDto {
  allocationId: string;
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  allocationDate: string;
}

export class PaymentResponseDto {
  paymentId: string;
  companyId: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNumber: string | null;
  bankName: string | null;
  chequeNumber: string | null;
  chequeDate: string | null;
  status: PaymentStatus;
  notes: string | null;
  receiptId: string | null;
  receiptNumber: string | null;
  allocations: PaymentAllocationResponseDto[];
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
