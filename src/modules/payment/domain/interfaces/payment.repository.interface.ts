import { Payment } from '../entities/payment.domain.entity';
import { PaymentAllocation } from '../entities/payment-allocation.domain.entity';
import { Receipt } from '../entities/receipt.domain.entity';
import { ReceiptInvoiceMapping } from '../entities/receipt-invoice-mapping.domain.entity';

export const PAYMENT_REPOSITORY_TOKEN = 'PAYMENT_REPOSITORY';
export const PAYMENT_ALLOCATION_REPOSITORY_TOKEN = 'PAYMENT_ALLOCATION_REPOSITORY';
export const RECEIPT_REPOSITORY_TOKEN = 'RECEIPT_REPOSITORY';
export const RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN = 'RECEIPT_INVOICE_MAPPING_REPOSITORY';

export interface IPaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(paymentId: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  findByCompany(companyId: string): Promise<Payment[]>;
  findByReceipt(receiptId: string): Promise<Payment | null>;
  findWithoutReceipt(companyId?: string): Promise<Payment[]>; // Find payments that don't have receipts yet
  update(payment: Payment): Promise<Payment>;
}

export interface IPaymentAllocationRepository {
  create(allocation: PaymentAllocation): Promise<PaymentAllocation>;
  findByPayment(paymentId: string): Promise<PaymentAllocation[]>;
  findByInvoice(invoiceId: string): Promise<PaymentAllocation[]>;
  deleteByPayment(paymentId: string): Promise<void>;
}

export interface IReceiptRepository {
  create(receipt: Receipt, financialYear: string, sequenceNumber: number): Promise<Receipt>;
  findById(receiptId: string): Promise<Receipt | null>;
  findByCompany(companyId: string): Promise<Receipt[]>;
  findByPayment(paymentId: string): Promise<Receipt | null>;
  findByReceiptNumber(receiptNumber: string): Promise<Receipt | null>;
  findLastSequenceForFinancialYear(financialYear: string): Promise<number>;
  update(receipt: Receipt): Promise<Receipt>;
}

export interface IReceiptInvoiceMappingRepository {
  create(mapping: ReceiptInvoiceMapping): Promise<ReceiptInvoiceMapping>;
  findByReceipt(receiptId: string): Promise<ReceiptInvoiceMapping[]>;
  findByInvoice(invoiceId: string): Promise<ReceiptInvoiceMapping[]>;
  deleteByReceipt(receiptId: string): Promise<void>;
}
