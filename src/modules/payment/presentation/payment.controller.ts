import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ProcessPaymentUseCase } from '../application/use-cases/process-payment.use-case';
import { RecordPaymentUseCase } from '../application/use-cases/record-payment.use-case';
import { CreateManualReceiptUseCase } from '../application/use-cases/create-manual-receipt.use-case';
import { CreatePaymentDto } from '../application/dto/create-payment.dto';
import { RecordPaymentDto } from '../application/dto/record-payment.dto';
import { CreateManualReceiptDto } from '../application/dto/create-manual-receipt.dto';
import { PaymentResponseDto } from '../application/dto/payment-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { Payment } from '../domain/entities/payment.domain.entity';
import { PaymentAllocation } from '../domain/entities/payment-allocation.domain.entity';
import { Receipt } from '../domain/entities/receipt.domain.entity';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../domain/interfaces/payment.repository.interface';
import { IPaymentAllocationRepository, PAYMENT_ALLOCATION_REPOSITORY_TOKEN } from '../domain/interfaces/payment.repository.interface';
import { IReceiptRepository, RECEIPT_REPOSITORY_TOKEN } from '../domain/interfaces/payment.repository.interface';
import { IReceiptInvoiceMappingRepository, RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN } from '../domain/interfaces/payment.repository.interface';
import { Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../invoice/domain/interfaces/invoice.repository.interface';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class PaymentController {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly recordPaymentUseCase: RecordPaymentUseCase,
    private readonly createManualReceiptUseCase: CreateManualReceiptUseCase,
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
  ) {}

  /**
   * Record payment for a single invoice (simplified flow)
   * Used for offline payments: NEFT, RTGS, Cash, Cheque
   * Future-ready: Can be extended for online payment gateways
   */
  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async recordPayment(@Body() recordPaymentDto: RecordPaymentDto, @Request() req: any) {
    const result = await this.recordPaymentUseCase.execute(
      recordPaymentDto,
      req.user?.userId,
    );

    const paymentDto = await this.toPaymentResponseDto(
      result.payment,
      [result.allocation],
      result.receipt,
    );

    return {
      success: true,
      data: {
        payment: paymentDto,
        receipt: {
          receiptId: result.receipt.receiptId,
          receiptNumber: result.receipt.receiptNumber,
          receiptDate: result.receipt.receiptDate.toISOString().split('T')[0],
          totalAmount: result.receipt.totalAmount,
        },
        invoice: {
          invoiceId: result.updatedInvoice.invoiceId,
          invoiceNumber: result.updatedInvoice.invoiceNumber,
          totalPaidAmount: result.updatedInvoice.totalPaidAmount,
          balanceAmount: result.updatedInvoice.balanceAmount,
          status: result.updatedInvoice.status,
        },
      },
    };
  }

  /**
   * Process payment for multiple invoices (FIFO allocation)
   * Used for bulk payments or complex allocation scenarios
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE') // Use INVOICE_CREATE permission (payment is part of invoice management)
  async processPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    const result = await this.processPaymentUseCase.execute(
      createPaymentDto,
      req.user?.userId,
    );

    const paymentDto = await this.toPaymentResponseDto(result.payment, result.allocations, result.receipt);
    
    return {
      success: true,
      data: {
        payment: paymentDto,
        receipt: {
          receiptId: result.receipt.receiptId,
          receiptNumber: result.receipt.receiptNumber,
          receiptDate: result.receipt.receiptDate.toISOString().split('T')[0],
          totalAmount: result.receipt.totalAmount,
        },
        invoiceUpdates: result.invoiceUpdates.map(inv => ({
          invoiceId: inv.invoiceId,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          totalPaidAmount: inv.totalPaidAmount,
          balanceAmount: inv.balanceAmount,
        })),
      },
    };
  }

  /**
   * Get payments without receipts (for manual receipt creation)
   * Must be defined before @Get(':id') to avoid route conflict
   */
  @Get('without-receipt')
  @RequirePermissions('INVOICE_VIEW')
  async getPaymentsWithoutReceipt(@Query('companyId') companyId?: string) {
    const payments = await this.paymentRepository.findWithoutReceipt(companyId);
    
    // Get allocations for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const allocations = await this.allocationRepository.findByPayment(payment.paymentId);
        const receipt = null; // Payments without receipts
        return await this.toPaymentResponseDto(payment, allocations, receipt);
      })
    );

    return {
      success: true,
      data: paymentsWithDetails,
    };
  }

  @Get(':id')
  @RequirePermissions('INVOICE_VIEW') // Use INVOICE_VIEW permission
  async getPayment(@Param('id') paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const allocations = await this.allocationRepository.findByPayment(paymentId);
    const receipt = payment.receiptId ? await this.receiptRepository.findById(payment.receiptId) : null;

    const paymentDto = await this.toPaymentResponseDto(payment, allocations, receipt);
    return {
      success: true,
      data: paymentDto,
    };
  }

  @Get()
  @RequirePermissions('INVOICE_VIEW') // Use INVOICE_VIEW permission
  async getAllPayments(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('paymentDateFrom') paymentDateFrom?: string,
    @Query('paymentDateTo') paymentDateTo?: string,
  ) {
    let payments: Payment[] = [];

    if (companyId) {
      payments = await this.paymentRepository.findByCompany(companyId);
    }

    // Filter by status
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    // Filter by date range
    if (paymentDateFrom) {
      const fromDate = new Date(paymentDateFrom);
      payments = payments.filter(p => p.paymentDate >= fromDate);
    }
    if (paymentDateTo) {
      const toDate = new Date(paymentDateTo);
      payments = payments.filter(p => p.paymentDate <= toDate);
    }

    // Get allocations and receipts for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const allocations = await this.allocationRepository.findByPayment(payment.paymentId);
        const receipt = payment.receiptId ? await this.receiptRepository.findById(payment.receiptId) : null;
        return await this.toPaymentResponseDto(payment, allocations, receipt);
      })
    );

    return {
      success: true,
      data: paymentsWithDetails,
    };
  }

  /**
   * Get payment history for a specific invoice
   * Returns all payments made against the invoice with receipt details
   */
  @Get('invoice/:invoiceId')
  @RequirePermissions('INVOICE_VIEW') // Use INVOICE_VIEW permission
  async getPaymentsByInvoice(@Param('invoiceId') invoiceId: string) {
    // Validate invoice exists
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get all payment allocations for this invoice
    const allocations = await this.allocationRepository.findByInvoice(invoiceId);
    
    // Get all payments
    const payments = await Promise.all(
      allocations.map(a => this.paymentRepository.findById(a.paymentId))
    );

    // Build payment history with details
    const paymentHistory = await Promise.all(
      payments
        .filter((p): p is Payment => p !== null)
        .map(async (payment) => {
          const paymentAllocations = allocations.filter(a => a.paymentId === payment.paymentId);
          const receipt = payment.receiptId ? await this.receiptRepository.findById(payment.receiptId) : null;
          const paymentDto = await this.toPaymentResponseDto(payment, paymentAllocations, receipt);
          
          return {
            ...paymentDto,
            allocatedAmount: paymentAllocations.find(a => a.invoiceId === invoiceId)?.allocatedAmount || 0,
          };
        })
    );

    // Sort by payment date (newest first)
    paymentHistory.sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );

    return {
      success: true,
      data: {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceValue: invoice.invoiceValue,
        totalPaidAmount: invoice.totalPaidAmount,
        balanceAmount: invoice.balanceAmount,
        status: invoice.status,
        paymentHistory,
      },
    };
  }

  /**
   * Manually create a receipt for an existing payment
   * Requires that the payment exists, is completed, and doesn't already have a receipt
   */
  @Post('receipts/manual')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE') // Use INVOICE_CREATE permission
  async createManualReceipt(@Body() createManualReceiptDto: CreateManualReceiptDto, @Request() req: any) {
    const result = await this.createManualReceiptUseCase.execute(
      createManualReceiptDto,
      req.user?.userId,
    );

    return {
      success: true,
      data: {
        receipt: {
          receiptId: result.receipt.receiptId,
          receiptNumber: result.receipt.receiptNumber,
          receiptDate: result.receipt.receiptDate.toISOString().split('T')[0],
          totalAmount: result.receipt.totalAmount,
        },
        payment: {
          paymentId: result.payment.paymentId,
          paymentDate: result.payment.paymentDate.toISOString().split('T')[0],
          paymentAmount: result.payment.paymentAmount,
          paymentMode: result.payment.paymentMode,
        },
      },
    };
  }


  @Get('receipts/:id')
  @RequirePermissions('INVOICE_VIEW') // Use INVOICE_VIEW permission
  async getReceipt(@Param('id') receiptId: string) {
    const receipt = await this.receiptRepository.findById(receiptId);
    if (!receipt) {
      throw new Error('Receipt not found');
    }

    const payment = await this.paymentRepository.findByReceipt(receiptId);
    const mappings = await this.receiptInvoiceMappingRepository.findByReceipt(receiptId);
    const invoices = await Promise.all(
      mappings.map(m => this.invoiceRepository.findById(m.invoiceId))
    );

    return {
      success: true,
      data: {
        receiptId: receipt.receiptId,
        receiptNumber: receipt.receiptNumber,
        receiptDate: receipt.receiptDate.toISOString().split('T')[0],
        totalAmount: receipt.totalAmount,
        payment: payment ? {
          paymentId: payment.paymentId,
          paymentDate: payment.paymentDate.toISOString().split('T')[0],
          paymentAmount: payment.paymentAmount,
          paymentMode: payment.paymentMode,
        } : null,
        invoices: invoices
          .filter((inv): inv is any => inv !== null)
          .map((invoice, index) => ({
            invoiceId: invoice.invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            allocatedAmount: mappings[index].allocatedAmount,
          })),
      },
    };
  }

  private async toPaymentResponseDto(
    payment: Payment,
    allocations: PaymentAllocation[],
    receipt: Receipt | null,
  ): Promise<PaymentResponseDto> {
    const allocationDetails = await Promise.all(
      allocations.map(async (a) => {
        const invoice = await this.invoiceRepository.findById(a.invoiceId);
        return {
          allocationId: a.allocationId,
          invoiceId: a.invoiceId,
          invoiceNumber: invoice?.invoiceNumber || 'N/A',
          allocatedAmount: a.allocatedAmount,
          allocationDate: a.allocationDate.toISOString().split('T')[0],
        };
      })
    );

    return {
      paymentId: payment.paymentId,
      companyId: payment.companyId,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      paymentAmount: payment.paymentAmount,
      paymentMode: payment.paymentMode,
      referenceNumber: payment.referenceNumber,
      bankName: payment.bankName,
      chequeNumber: payment.chequeNumber,
      chequeDate: payment.chequeDate ? payment.chequeDate.toISOString().split('T')[0] : null,
      status: payment.status,
      notes: payment.notes,
      receiptId: payment.receiptId,
      receiptNumber: receipt?.receiptNumber || null,
      allocations: allocationDetails,
      createdBy: payment.createdBy,
      createdOn: payment.createdOn.toISOString(),
      modifiedBy: payment.modifiedBy,
      modifiedOn: payment.modifiedOn.toISOString(),
    };
  }
}
