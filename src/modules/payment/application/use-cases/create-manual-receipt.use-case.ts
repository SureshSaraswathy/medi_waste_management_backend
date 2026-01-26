import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Payment } from '../../domain/entities/payment.domain.entity';
import { Receipt } from '../../domain/entities/receipt.domain.entity';
import { ReceiptInvoiceMapping } from '../../domain/entities/receipt-invoice-mapping.domain.entity';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
  IReceiptRepository,
  RECEIPT_REPOSITORY_TOKEN,
  IReceiptInvoiceMappingRepository,
  RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN,
  IPaymentAllocationRepository,
  PAYMENT_ALLOCATION_REPOSITORY_TOKEN,
} from '../../domain/interfaces/payment.repository.interface';
import { CreateManualReceiptDto } from '../dto/create-manual-receipt.dto';
import { ReceiptNumberService } from '../services/receipt-number.service';
import { PaymentStatus } from '../../domain/entities/payment.domain.entity';

/**
 * Use case for manually creating a receipt for an existing payment
 * Requires that the payment exists, is completed, and doesn't already have a receipt
 */
@Injectable()
export class CreateManualReceiptUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(RECEIPT_REPOSITORY_TOKEN)
    private readonly receiptRepository: IReceiptRepository,
    @Inject(RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN)
    private readonly receiptInvoiceMappingRepository: IReceiptInvoiceMappingRepository,
    @Inject(PAYMENT_ALLOCATION_REPOSITORY_TOKEN)
    private readonly allocationRepository: IPaymentAllocationRepository,
    private readonly receiptNumberService: ReceiptNumberService,
  ) {}

  async execute(createManualReceiptDto: CreateManualReceiptDto, createdBy?: string): Promise<{
    receipt: Receipt;
    payment: Payment;
  }> {
    // Get and validate payment
    const payment = await this.paymentRepository.findById(createManualReceiptDto.paymentId);
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.isDeleted) {
      throw new BadRequestException('Payment is deleted');
    }

    // Validation: Payment must be completed
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(`Payment must be completed to create a receipt. Current status: ${payment.status}`);
    }

    // Validation: Payment must not already have a receipt
    if (payment.receiptId) {
      const existingReceipt = await this.receiptRepository.findById(payment.receiptId);
      if (existingReceipt) {
        throw new BadRequestException(
          `Payment already has a receipt: ${existingReceipt.receiptNumber}. Cannot create duplicate receipt.`
        );
      }
    }

    // Use provided receipt date or default to payment date
    const receiptDate = createManualReceiptDto.receiptDate
      ? new Date(createManualReceiptDto.receiptDate)
      : payment.paymentDate;

    // Generate receipt number
    const { receiptNumber, financialYear, sequenceNumber } = await this.receiptNumberService.generateReceiptNumber(
      receiptDate,
      payment.companyId
    );

    // Create receipt
    const receipt = Receipt.create({
      receiptId: randomUUID(),
      companyId: payment.companyId,
      receiptNumber,
      receiptDate,
      totalAmount: payment.paymentAmount,
      paymentId: payment.paymentId,
      notes: createManualReceiptDto.notes ?? null,
      createdBy,
    });

    const savedReceipt = await this.receiptRepository.create(receipt, financialYear, sequenceNumber);

    // Update payment with receipt ID
    payment.complete(savedReceipt.receiptId, createdBy);
    const updatedPayment = await this.paymentRepository.update(payment);

    // Get payment allocations to create receipt-invoice mappings
    const allocations = await this.allocationRepository.findByPayment(payment.paymentId);
    
    // Create receipt-invoice mappings for all allocated invoices
    for (const allocation of allocations) {
      const receiptInvoiceMapping = ReceiptInvoiceMapping.create({
        mappingId: randomUUID(),
        receiptId: savedReceipt.receiptId,
        invoiceId: allocation.invoiceId,
        allocatedAmount: allocation.allocatedAmount,
        createdBy,
      });

      await this.receiptInvoiceMappingRepository.create(receiptInvoiceMapping);
    }

    return {
      receipt: savedReceipt,
      payment: updatedPayment,
    };
  }
}
