import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './infrastructure/transaction/invoice.entity';
import { InvoiceRepository } from './infrastructure/persistence/invoice.repository';
import { InvoiceController } from './presentation/invoice.controller';
import { CreateInvoiceUseCase } from './application/use-cases/create-invoice.use-case';
import { GenerateInvoiceAutoUseCase } from './application/use-cases/generate-invoice-auto.use-case';
import { GenerateInvoiceWeightUseCase } from './application/use-cases/generate-invoice-weight.use-case';
import { GenerateInvoiceMonthUseCase } from './application/use-cases/generate-invoice-month.use-case';
import { GetInvoiceUseCase } from './application/use-cases/get-invoice.use-case';
import { GetAllInvoicesUseCase } from './application/use-cases/get-all-invoices.use-case';
import { UpdateInvoiceUseCase } from './application/use-cases/update-invoice.use-case';
import { DeleteInvoiceUseCase } from './application/use-cases/delete-invoice.use-case';
import { InvoiceNumberService } from './application/services/invoice-number.service';
import { InvoiceCalculationService } from './application/services/invoice-calculation.service';
import { InvoiceLockService } from './application/services/invoice-lock.service';
import { INVOICE_REPOSITORY_TOKEN } from './domain/interfaces/invoice.repository.interface';
import { HcfModule } from '../hcf/hcf.module';
import { CompanyModule } from '../company/company.module';
import { WasteTransactionModule } from '../waste-transaction/waste-transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity], 'transaction'),
    HcfModule,
    CompanyModule,
    WasteTransactionModule,
  ],
  controllers: [InvoiceController],
  providers: [
    {
      provide: INVOICE_REPOSITORY_TOKEN,
      useClass: InvoiceRepository,
    },
    CreateInvoiceUseCase,
    GenerateInvoiceAutoUseCase,
    GenerateInvoiceWeightUseCase,
    GenerateInvoiceMonthUseCase,
    GetInvoiceUseCase,
    GetAllInvoicesUseCase,
    UpdateInvoiceUseCase,
    DeleteInvoiceUseCase,
    InvoiceNumberService,
    InvoiceCalculationService,
    InvoiceLockService,
  ],
  exports: [INVOICE_REPOSITORY_TOKEN],
})
export class InvoiceModule {}
