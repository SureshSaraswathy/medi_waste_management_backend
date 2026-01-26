import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Payment, PaymentStatus, PaymentMode } from '../../domain/entities/payment.domain.entity';
import { PaymentAllocation } from '../../domain/entities/payment-allocation.domain.entity';
import { Receipt } from '../../domain/entities/receipt.domain.entity';
import { ReceiptInvoiceMapping } from '../../domain/entities/receipt-invoice-mapping.domain.entity';
import { Invoice } from '../../../invoice/domain/entities/invoice.domain.entity';
import { InvoiceStatus } from '../../../invoice/infrastructure/transaction/invoice.entity';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
  IPaymentAllocationRepository,
  PAYMENT_ALLOCATION_REPOSITORY_TOKEN,
  IReceiptRepository,
  RECEIPT_REPOSITORY_TOKEN,
  IReceiptInvoiceMappingRepository,
  RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN,
} from '../../domain/interfaces/payment.repository.interface';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../../invoice/domain/interfaces/invoice.repository.interface';
import { RecordPaymentDto } from '../dto/record-payment.dto';
import { ReceiptNumberService } from '../services/receipt-number.service';
import {
  InvalidPaymentAmountException,
  InvalidInvoiceStatusException,
  InsufficientPaymentAmountException,
} from '../../domain/exceptions/payment.exceptions';

/**
 * Simplified use case for recording a payment against a single invoice
 * Used for offline payments (NEFT, RTGS, Cash, Cheque)
 * Future-ready: Can be extended to support online payment gateways
 */
@Injectable()
export class RecordPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_ALLOCATION_REPOSITORY_TOKEN)
    private readonly allocationRepository: IPaymentAllocationRepository,
    @Inject(RECEIPT_REPOSITORY_TOKEN)
    private readonly receiptRepository: IReceiptRepository,
    @Inject(RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN)
    private readonly receiptInvoiceMappingRepository: IReceiptInvoiceMappingRepository,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly receiptNumberService: ReceiptNumberService,
  ) {}

  async execute(recordPaymentDto: RecordPaymentDto, createdBy?: string): Promise<{
    payment: Payment;
    receipt: Receipt;
    allocation: PaymentAllocation;
    updatedInvoice: Invoice;
  }> {
    const paymentDate = new Date(recordPaymentDto.paymentDate);
    const paymentAmount = Number(recordPaymentDto.paymentAmount);

    // Validation: Payment amount must be greater than zero
    if (paymentAmount <= 0) {
      throw new InvalidPaymentAmountException('Payment amount must be greater than zero');
    }

    // Get and validate invoice
    const invoice = await this.invoiceRepository.findById(recordPaymentDto.invoiceId);
    if (!invoice) {
      throw new BadRequestException(`Invoice not found`);
    }

    if (invoice.isDeleted) {
      throw new BadRequestException(`Invoice ${invoice.invoiceNumber} is deleted`);
    }

    // Validation: Only Generated or Partially Paid invoices can receive payments
    if (invoice.status !== InvoiceStatus.GENERATED && invoice.status !== InvoiceStatus.PARTIALLY_PAID) {
      throw new InvalidInvoiceStatusException(
        invoice.invoiceNumber,
        invoice.status,
        'Only Generated or Partially Paid invoices can receive payments'
      );
    }

    // Validation: Payment amount must not exceed invoice balance
    const balanceAmount = Number(invoice.balanceAmount);
    if (paymentAmount > balanceAmount + 0.01) { // Allow small rounding differences
      throw new InsufficientPaymentAmountException(
        paymentAmount,
        balanceAmount,
        `Payment amount (${paymentAmount}) exceeds invoice balance (${balanceAmount})`
      );
    }

    // Create payment record
    const payment = Payment.create({
      paymentId: randomUUID(),
      companyId: invoice.companyId,
      paymentDate,
      paymentAmount,
      paymentMode: recordPaymentDto.paymentMode,
      referenceNumber: recordPaymentDto.referenceNumber,
      bankName: recordPaymentDto.bankName,
      chequeNumber: recordPaymentDto.chequeNumber,
      chequeDate: recordPaymentDto.chequeDate ? new Date(recordPaymentDto.chequeDate) : null,
      notes: recordPaymentDto.notes,
      createdBy,
    });

    const savedPayment = await this.paymentRepository.create(payment);

    // Create payment allocation (one-to-one: payment -> invoice)
    const paymentAllocation = PaymentAllocation.create({
      allocationId: randomUUID(),
      paymentId: savedPayment.paymentId,
      invoiceId: invoice.invoiceId,
      allocatedAmount: paymentAmount,
      createdBy,
    });

    const savedAllocation = await this.allocationRepository.create(paymentAllocation);

    // Update invoice: paid_amount, balance_amount, and status
    const newTotalPaid = Number(invoice.totalPaidAmount) + paymentAmount;
    const newBalance = Number(invoice.balanceAmount) - paymentAmount;

    // Update invoice payment amounts (using type assertion for mutable properties)
    (invoice as any).totalPaidAmount = newTotalPaid;
    (invoice as any).balanceAmount = newBalance;

    // Update invoice status based on balance
    // Generated → Partial → Paid
    if (newBalance <= 0.01) {
      (invoice as any).status = InvoiceStatus.PAID;
    } else {
      (invoice as any).status = InvoiceStatus.PARTIALLY_PAID;
    }

    (invoice as any).modifiedBy = createdBy;
    (invoice as any).modifiedOn = new Date();

    const updatedInvoice = await this.invoiceRepository.update(invoice);

    // Generate receipt
    const { receiptNumber, financialYear, sequenceNumber } = await this.receiptNumberService.generateReceiptNumber(
      paymentDate,
      invoice.companyId
    );

    const receipt = Receipt.create({
      receiptId: randomUUID(),
      companyId: invoice.companyId,
      receiptNumber,
      receiptDate: paymentDate,
      totalAmount: paymentAmount,
      paymentId: savedPayment.paymentId,
      notes: recordPaymentDto.notes,
      createdBy,
    });

    const savedReceipt = await this.receiptRepository.create(receipt, financialYear, sequenceNumber);

    // Update payment with receipt ID and mark as completed
    savedPayment.complete(savedReceipt.receiptId, createdBy);
    await this.paymentRepository.update(savedPayment);

    // Create receipt-invoice mapping
    const receiptInvoiceMapping = ReceiptInvoiceMapping.create({
      mappingId: randomUUID(),
      receiptId: savedReceipt.receiptId,
      invoiceId: invoice.invoiceId,
      allocatedAmount: paymentAmount,
      createdBy,
    });

    await this.receiptInvoiceMappingRepository.create(receiptInvoiceMapping);

    return {
      payment: savedPayment,
      receipt: savedReceipt,
      allocation: savedAllocation,
      updatedInvoice,
    };
  }
}
