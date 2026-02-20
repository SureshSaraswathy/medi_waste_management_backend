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
import { CreatePaymentDto, InvoiceAllocationDto } from '../dto/create-payment.dto';
import { ReceiptNumberService } from '../services/receipt-number.service';
import {
  InvalidPaymentAmountException,
  InvalidInvoiceStatusException,
  InsufficientPaymentAmountException,
} from '../../domain/exceptions/payment.exceptions';

interface FIFOAllocation {
  invoiceId: string;
  invoiceNumber: string;
  balanceAmount: number;
  allocatedAmount: number;
}

@Injectable()
export class ProcessPaymentUseCase {
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

  async execute(createPaymentDto: CreatePaymentDto, createdBy?: string): Promise<{
    payment: Payment;
    receipt: Receipt;
    allocations: PaymentAllocation[];
    invoiceUpdates: Invoice[];
  }> {
    const paymentDate = new Date(createPaymentDto.paymentDate);
    const paymentAmount = Number(createPaymentDto.paymentAmount);

    if (paymentAmount <= 0) {
      throw new InvalidPaymentAmountException('Payment amount must be greater than zero');
    }

    // Get invoices to be paid
    const invoiceIds = createPaymentDto.invoiceAllocations.map(a => a.invoiceId);
    
    if (invoiceIds.length === 0) {
      throw new BadRequestException('At least one invoice must be specified for payment');
    }
    
    const invoices = await Promise.all(
      invoiceIds.map(id => this.invoiceRepository.findById(id))
    );

    // Validate all invoices exist and can be paid
    const validInvoices: Invoice[] = [];
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      if (!invoice) {
        throw new BadRequestException(`Invoice with ID ${invoiceIds[i]} not found`);
      }
      if (invoice.isDeleted) {
        throw new BadRequestException(`Invoice ${invoice.invoiceNumber} is deleted`);
      }
      if (invoice.status !== InvoiceStatus.DUE && invoice.status !== InvoiceStatus.PARTIAL_PAID) {
        throw new InvalidInvoiceStatusException(invoice.invoiceNumber, invoice.status);
      }
      if (invoice.companyId !== createPaymentDto.companyId) {
        throw new BadRequestException(`Invoice ${invoice.invoiceNumber} does not belong to the specified company`);
      }
      validInvoices.push(invoice);
    }

    // Determine if this is FIFO (all allocatedAmounts are 0) or manual allocation
    const isFIFOMode = createPaymentDto.invoiceAllocations.every(a => a.allocatedAmount === 0);
    
    // Calculate allocations (FIFO if all amounts are 0, or use provided allocations)
    const allocations = isFIFOMode
      ? await this.calculateFIFOAllocations(validInvoices, paymentAmount)
      : await this.calculateManualAllocations(createPaymentDto.invoiceAllocations, validInvoices, paymentAmount);

    // Validate total allocation matches payment amount
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (Math.abs(totalAllocated - paymentAmount) > 0.01) {
      throw new InsufficientPaymentAmountException(paymentAmount, totalAllocated);
    }

    // Create payment
    const payment = Payment.create({
      paymentId: randomUUID(),
      companyId: createPaymentDto.companyId,
      paymentDate,
      paymentAmount,
      paymentMode: createPaymentDto.paymentMode,
      referenceNumber: createPaymentDto.referenceNumber,
      bankName: createPaymentDto.bankName,
      chequeNumber: createPaymentDto.chequeNumber,
      chequeDate: createPaymentDto.chequeDate ? new Date(createPaymentDto.chequeDate) : null,
      notes: createPaymentDto.notes,
      createdBy,
    });

    const savedPayment = await this.paymentRepository.create(payment);

    // Create payment allocations
    const paymentAllocations: PaymentAllocation[] = [];
    for (const allocation of allocations) {
      const paymentAllocation = PaymentAllocation.create({
        allocationId: randomUUID(),
        paymentId: savedPayment.paymentId,
        invoiceId: allocation.invoiceId,
        allocatedAmount: allocation.allocatedAmount,
        createdBy,
      });
      const savedAllocation = await this.allocationRepository.create(paymentAllocation);
      paymentAllocations.push(savedAllocation);
    }

    // Update invoices and calculate new statuses
    const updatedInvoices: Invoice[] = [];
    for (const allocation of allocations) {
      const invoice = validInvoices.find(inv => inv.invoiceId === allocation.invoiceId)!;
      const newTotalPaid = Number(invoice.totalPaidAmount) + allocation.allocatedAmount;
      const newBalance = Number(invoice.balanceAmount) - allocation.allocatedAmount;

      // Update invoice payment amounts
      (invoice as any).totalPaidAmount = newTotalPaid;
      (invoice as any).balanceAmount = newBalance;

      // Update invoice status
      if (newBalance <= 0.01) {
        (invoice as any).status = InvoiceStatus.PAID;
      } else if (invoice.status === InvoiceStatus.DUE) {
        (invoice as any).status = InvoiceStatus.PARTIAL_PAID;
      }
      // If already PARTIAL_PAID, keep it as PARTIAL_PAID

      (invoice as any).modifiedBy = createdBy;
      (invoice as any).modifiedOn = new Date();

      const updatedInvoice = await this.invoiceRepository.update(invoice);
      updatedInvoices.push(updatedInvoice);
    }

    // Generate receipt
    const { receiptNumber, financialYear, sequenceNumber } = await this.receiptNumberService.generateReceiptNumber(paymentDate, createPaymentDto.companyId);
    const receipt = Receipt.create({
      receiptId: randomUUID(),
      companyId: createPaymentDto.companyId,
      receiptNumber,
      receiptDate: paymentDate,
      totalAmount: paymentAmount,
      paymentId: savedPayment.paymentId,
      notes: createPaymentDto.notes,
      createdBy,
    });

    const savedReceipt = await this.receiptRepository.create(receipt, financialYear, sequenceNumber);

    // Update payment with receipt ID
    savedPayment.complete(savedReceipt.receiptId, createdBy);
    await this.paymentRepository.update(savedPayment);

    // Create receipt-invoice mappings
    for (const allocation of allocations) {
      const mapping = ReceiptInvoiceMapping.create({
        mappingId: randomUUID(),
        receiptId: savedReceipt.receiptId,
        invoiceId: allocation.invoiceId,
        allocatedAmount: allocation.allocatedAmount,
        createdBy,
      });
      await this.receiptInvoiceMappingRepository.create(mapping);
    }

    return {
      payment: savedPayment,
      receipt: savedReceipt,
      allocations: paymentAllocations,
      invoiceUpdates: updatedInvoices,
    };
  }

  /**
   * Calculate FIFO allocations (oldest invoices first)
   */
  private async calculateFIFOAllocations(invoices: Invoice[], paymentAmount: number): Promise<FIFOAllocation[]> {
    // Sort invoices by due date (oldest first), then by invoice date
    const sortedInvoices = [...invoices].sort((a, b) => {
      const dueDateCompare = a.dueDate.getTime() - b.dueDate.getTime();
      if (dueDateCompare !== 0) return dueDateCompare;
      return a.invoiceDate.getTime() - b.invoiceDate.getTime();
    });

    const allocations: FIFOAllocation[] = [];
    let remainingAmount = paymentAmount;

    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0.01) break;

      const balanceAmount = Number(invoice.balanceAmount);
      if (balanceAmount <= 0.01) continue; // Skip fully paid invoices

      const allocatedAmount = Math.min(remainingAmount, balanceAmount);
      allocations.push({
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        balanceAmount,
        allocatedAmount,
      });

      remainingAmount -= allocatedAmount;
    }

    if (remainingAmount > 0.01) {
      throw new InsufficientPaymentAmountException(
        paymentAmount,
        paymentAmount - remainingAmount
      );
    }

    return allocations;
  }

  /**
   * Calculate manual allocations (validate provided allocations)
   */
  private async calculateManualAllocations(
    providedAllocations: InvoiceAllocationDto[],
    invoices: Invoice[],
    paymentAmount: number,
  ): Promise<FIFOAllocation[]> {
    const allocations: FIFOAllocation[] = [];
    let totalAllocated = 0;

    for (const provided of providedAllocations) {
      const invoice = invoices.find(inv => inv.invoiceId === provided.invoiceId);
      if (!invoice) {
        throw new BadRequestException(`Invoice ${provided.invoiceId} not found in selected invoices`);
      }

      const balanceAmount = Number(invoice.balanceAmount);
      if (provided.allocatedAmount > balanceAmount) {
        throw new BadRequestException(
          `Allocated amount ${provided.allocatedAmount} exceeds balance ${balanceAmount} for invoice ${invoice.invoiceNumber}`
        );
      }

      allocations.push({
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        balanceAmount,
        allocatedAmount: provided.allocatedAmount,
      });

      totalAllocated += provided.allocatedAmount;
    }

    if (Math.abs(totalAllocated - paymentAmount) > 0.01) {
      throw new BadRequestException(
        `Total allocated amount ${totalAllocated} does not match payment amount ${paymentAmount}`
      );
    }

    return allocations;
  }
}
