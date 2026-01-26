import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './infrastructure/transaction/payment.entity';
import { PaymentAllocationEntity } from './infrastructure/transaction/payment-allocation.entity';
import { ReceiptEntity } from './infrastructure/transaction/receipt.entity';
import { ReceiptInvoiceMappingEntity } from './infrastructure/transaction/receipt-invoice-mapping.entity';
import { PaymentRepository } from './infrastructure/persistence/payment.repository';
import { PaymentAllocationRepository } from './infrastructure/persistence/payment-allocation.repository';
import { ReceiptRepository } from './infrastructure/persistence/receipt.repository';
import { ReceiptInvoiceMappingRepository } from './infrastructure/persistence/receipt-invoice-mapping.repository';
import { PaymentController } from './presentation/payment.controller';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { RecordPaymentUseCase } from './application/use-cases/record-payment.use-case';
import { CreateManualReceiptUseCase } from './application/use-cases/create-manual-receipt.use-case';
import { ReceiptNumberService } from './application/services/receipt-number.service';
import {
  PAYMENT_REPOSITORY_TOKEN,
  PAYMENT_ALLOCATION_REPOSITORY_TOKEN,
  RECEIPT_REPOSITORY_TOKEN,
  RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN,
} from './domain/interfaces/payment.repository.interface';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [PaymentEntity, PaymentAllocationEntity, ReceiptEntity, ReceiptInvoiceMappingEntity],
      'transaction'
    ),
    InvoiceModule,
  ],
  controllers: [PaymentController],
  providers: [
    {
      provide: PAYMENT_REPOSITORY_TOKEN,
      useClass: PaymentRepository,
    },
    {
      provide: PAYMENT_ALLOCATION_REPOSITORY_TOKEN,
      useClass: PaymentAllocationRepository,
    },
    {
      provide: RECEIPT_REPOSITORY_TOKEN,
      useClass: ReceiptRepository,
    },
    {
      provide: RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN,
      useClass: ReceiptInvoiceMappingRepository,
    },
    ProcessPaymentUseCase,
    RecordPaymentUseCase,
    CreateManualReceiptUseCase,
    ReceiptNumberService,
  ],
  exports: [
    PAYMENT_REPOSITORY_TOKEN,
    PAYMENT_ALLOCATION_REPOSITORY_TOKEN,
    RECEIPT_REPOSITORY_TOKEN,
    RECEIPT_INVOICE_MAPPING_REPOSITORY_TOKEN,
    ProcessPaymentUseCase,
    ReceiptNumberService,
  ],
})
export class PaymentModule {}
