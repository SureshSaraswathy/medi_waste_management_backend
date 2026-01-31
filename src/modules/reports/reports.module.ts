import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from '../invoice/infrastructure/transaction/invoice.entity';
import { CompanyEntity } from '../company/infrastructure/persistence/company.entity';
import { HcfEntity } from '../hcf/infrastructure/persistence/hcf.entity';
import { ReportsController } from './presentation/reports.controller';
import { InvoiceReportQueryService } from './application/services/invoice-report-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity], 'transaction'),
    TypeOrmModule.forFeature([CompanyEntity], 'master'),
    TypeOrmModule.forFeature([HcfEntity], 'master'),
  ],
  controllers: [ReportsController],
  providers: [InvoiceReportQueryService],
  exports: [InvoiceReportQueryService],
})
export class ReportsModule {}
