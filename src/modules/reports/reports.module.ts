import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from '../invoice/infrastructure/transaction/invoice.entity';
import { CompanyEntity } from '../company/infrastructure/persistence/company.entity';
import { HcfEntity } from '../hcf/infrastructure/persistence/hcf.entity';
import { AreaEntity } from '../area/infrastructure/persistence/area.entity';
import { RouteEntity } from '../route/infrastructure/persistence/route.entity';
import { UserEntity } from '../user/infrastructure/persistence/user.entity';
import { WasteCollectionEntity } from '../waste-collection/infrastructure/transaction/waste-collection.entity';
import { RouteAssignmentEntity } from '../route-assignment/infrastructure/transaction/route-assignment.entity';
import { RouteHcfEntity } from '../route-hcf/infrastructure/persistence/route-hcf.entity';
import { WasteTransactionEntity } from '../waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { ReportsController } from './presentation/reports.controller';
import { InvoiceReportQueryService } from './application/services/invoice-report-query.service';
import { RouteTripReportQueryService } from './application/services/route-trip-report-query.service';
import { MissedRouteScheduleQueryService } from './application/services/missed-route-schedule-query.service';
import { HcfWasteCollectionHistoryQueryService } from './application/services/hcf-waste-collection-history-query.service';
import { VehicleWasteCollectionEntity } from '../vehicle-waste-collection/infrastructure/transaction/vehicle-waste-collection.entity';
import { CostAnalysisReportQueryService } from './application/services/cost-analysis-report-query.service';
import { ReceiptEntity } from '../payment/infrastructure/transaction/receipt.entity';
import { ReceiptInvoiceMappingEntity } from '../payment/infrastructure/transaction/receipt-invoice-mapping.entity';
import { HcfLedgerStatementQueryService } from './application/services/hcf-ledger-statement-query.service';
import { OperatorPcbReportQueryService } from './application/services/operator-pcb-report-query.service';
import { HcfTypeEntity } from '../hcf-type/infrastructure/persistence/hcf-type.entity';
import { PcbComplianceReportQueryService } from './application/services/pcb-compliance-report-query.service';
import { WasteCollectionSummaryReportQueryService } from './application/services/waste-collection-summary-report-query.service';
import { PcbZoneEntity } from '../pcb-zone/infrastructure/persistence/pcb-zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity, WasteCollectionEntity, RouteAssignmentEntity, WasteTransactionEntity, VehicleWasteCollectionEntity, ReceiptEntity, ReceiptInvoiceMappingEntity], 'transaction'),
    TypeOrmModule.forFeature([CompanyEntity, HcfEntity, AreaEntity, RouteEntity, UserEntity, RouteHcfEntity, HcfTypeEntity, PcbZoneEntity], 'master'),
  ],
  controllers: [ReportsController],
  providers: [
    InvoiceReportQueryService,
    RouteTripReportQueryService,
    MissedRouteScheduleQueryService,
    HcfWasteCollectionHistoryQueryService,
    CostAnalysisReportQueryService,
    HcfLedgerStatementQueryService,
    OperatorPcbReportQueryService,
    PcbComplianceReportQueryService,
    WasteCollectionSummaryReportQueryService,
  ],
  exports: [
    InvoiceReportQueryService,
    RouteTripReportQueryService,
    MissedRouteScheduleQueryService,
    HcfWasteCollectionHistoryQueryService,
    CostAnalysisReportQueryService,
    HcfLedgerStatementQueryService,
    OperatorPcbReportQueryService,
    PcbComplianceReportQueryService,
    WasteCollectionSummaryReportQueryService,
  ],
})
export class ReportsModule {}
