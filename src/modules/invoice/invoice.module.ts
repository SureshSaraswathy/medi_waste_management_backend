import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './infrastructure/transaction/invoice.entity';
import { InvoiceBatchEntity } from './infrastructure/transaction/invoice-batch.entity';
import { InvoiceBatchItemEntity } from './infrastructure/transaction/invoice-batch-item.entity';
import { InvoiceRepository } from './infrastructure/persistence/invoice.repository';
import { BatchRepository } from './infrastructure/persistence/batch.repository';
import { InvoiceController } from './presentation/invoice.controller';
import { BatchController } from './presentation/batch.controller';
import { CreateInvoiceUseCase } from './application/use-cases/create-invoice.use-case';
import { GenerateInvoiceAutoUseCase } from './application/use-cases/generate-invoice-auto.use-case';
import { GenerateInvoiceWeightUseCase } from './application/use-cases/generate-invoice-weight.use-case';
import { GenerateInvoiceMonthUseCase } from './application/use-cases/generate-invoice-month.use-case';
import { GetInvoiceUseCase } from './application/use-cases/get-invoice.use-case';
import { GetAllInvoicesUseCase } from './application/use-cases/get-all-invoices.use-case';
import { UpdateInvoiceUseCase } from './application/use-cases/update-invoice.use-case';
import { DeleteInvoiceUseCase } from './application/use-cases/delete-invoice.use-case';
import { PostInvoiceUseCase } from './application/use-cases/post-invoice.use-case';
import { InvoiceNumberService } from './application/services/invoice-number.service';
import { InvoiceCalculationService } from './application/services/invoice-calculation.service';
import { InvoiceGstCalculationService } from './application/services/invoice-gst-calculation.service';
import { InvoiceLockService } from './application/services/invoice-lock.service';
import { InvoicePdfService } from './application/services/invoice-pdf.service';
import { InvoiceQueueService } from './application/services/invoice-queue.service';
import { InvoiceBulkDownloadService } from './application/services/invoice-bulk-download.service';
import { INVOICE_REPOSITORY_TOKEN } from './domain/interfaces/invoice.repository.interface';
import { BATCH_REPOSITORY_TOKEN } from './domain/interfaces/batch.repository.interface';
import { BatchService } from './application/services/batch.service';
import { HcfModule } from '../hcf/hcf.module';
import { CompanyModule } from '../company/company.module';
import { CompanyEntity } from '../company/infrastructure/persistence/company.entity';
import { HcfEntity } from '../hcf/infrastructure/persistence/hcf.entity';
import { WasteTransactionModule } from '../waste-transaction/waste-transaction.module';
import { NotificationModule } from '../notification/notification.module';
import { InvoiceDownloadController } from './presentation/invoice-download.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity], 'transaction'),
    TypeOrmModule.forFeature([InvoiceBatchEntity], 'transaction'),
    TypeOrmModule.forFeature([InvoiceBatchItemEntity], 'transaction'),
    TypeOrmModule.forFeature([CompanyEntity], 'master'),
    TypeOrmModule.forFeature([HcfEntity], 'master'),
    HcfModule,
    CompanyModule,
    WasteTransactionModule,
    NotificationModule,
  ],
  controllers: [InvoiceController, InvoiceDownloadController, BatchController],
  providers: [
    {
      provide: INVOICE_REPOSITORY_TOKEN,
      useClass: InvoiceRepository,
    },
    {
      provide: BATCH_REPOSITORY_TOKEN,
      useClass: BatchRepository,
    },
    BatchService,
    CreateInvoiceUseCase,
    GenerateInvoiceAutoUseCase,
    GenerateInvoiceWeightUseCase,
    GenerateInvoiceMonthUseCase,
    GetInvoiceUseCase,
    GetAllInvoicesUseCase,
    UpdateInvoiceUseCase,
    DeleteInvoiceUseCase,
    PostInvoiceUseCase,
    InvoiceNumberService,
    InvoiceCalculationService,
    InvoiceGstCalculationService,
    InvoiceLockService,
    InvoicePdfService,
    InvoiceQueueService,
    InvoiceBulkDownloadService,
  ],
  exports: [
    INVOICE_REPOSITORY_TOKEN,
    InvoicePdfService,
    InvoiceBulkDownloadService,
  ],
})
export class InvoiceModule {}
