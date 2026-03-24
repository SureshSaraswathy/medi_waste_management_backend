import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { InvoiceReportQueryService } from '../application/services/invoice-report-query.service';
import { InvoiceReportRequestDto } from '../application/dto/invoice-report-request.dto';
import { RouteTripReportRequestDto } from '../application/dto/route-trip-report-request.dto';
import { RouteTripReportQueryService } from '../application/services/route-trip-report-query.service';
import { MissedRouteScheduleRequestDto } from '../application/dto/missed-route-schedule-request.dto';
import { MissedRouteScheduleQueryService } from '../application/services/missed-route-schedule-query.service';
import { HcfWasteCollectionHistoryRequestDto } from '../application/dto/hcf-waste-collection-history-request.dto';
import { HcfWasteCollectionHistoryQueryService } from '../application/services/hcf-waste-collection-history-query.service';
import { CostAnalysisReportRequestDto } from '../application/dto/cost-analysis-report-request.dto';
import { CostAnalysisReportQueryService } from '../application/services/cost-analysis-report-query.service';
import { HcfLedgerStatementRequestDto } from '../application/dto/hcf-ledger-statement-request.dto';
import { HcfLedgerStatementQueryService } from '../application/services/hcf-ledger-statement-query.service';
import { OperatorPcbReportRequestDto } from '../application/dto/operator-pcb-report-request.dto';
import { OperatorPcbReportQueryService } from '../application/services/operator-pcb-report-query.service';
import { PcbComplianceReportRequestDto } from '../application/dto/pcb-compliance-report-request.dto';
import { PcbComplianceReportQueryService } from '../application/services/pcb-compliance-report-query.service';
import { WasteCollectionSummaryReportRequestDto } from '../application/dto/waste-collection-summary-report-request.dto';
import { WasteCollectionSummaryReportQueryService } from '../application/services/waste-collection-summary-report-query.service';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

class ReportExportRequestDto {
  @IsString()
  @IsIn(['invoice', 'route-trip', 'missed-route-schedule', 'hcf-waste-collection-history', 'cost-analysis', 'hcf-ledger-statement', 'operator-pcb-collection', 'pcb-compliance', 'waste-collection-summary'])
  reportType!: 'invoice' | 'route-trip' | 'missed-route-schedule' | 'hcf-waste-collection-history' | 'cost-analysis' | 'hcf-ledger-statement' | 'operator-pcb-collection' | 'pcb-compliance' | 'waste-collection-summary';

  @IsString()
  @IsIn(['pdf', 'excel', 'csv'])
  format!: 'pdf' | 'excel' | 'csv';

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class ReportsController {
  constructor(
    private readonly invoiceReportQueryService: InvoiceReportQueryService,
    private readonly routeTripReportQueryService: RouteTripReportQueryService,
    private readonly missedRouteScheduleQueryService: MissedRouteScheduleQueryService,
    private readonly hcfWasteCollectionHistoryQueryService: HcfWasteCollectionHistoryQueryService,
    private readonly costAnalysisReportQueryService: CostAnalysisReportQueryService,
    private readonly hcfLedgerStatementQueryService: HcfLedgerStatementQueryService,
    private readonly operatorPcbReportQueryService: OperatorPcbReportQueryService,
    private readonly pcbComplianceReportQueryService: PcbComplianceReportQueryService,
    private readonly wasteCollectionSummaryReportQueryService: WasteCollectionSummaryReportQueryService,
  ) {}

  /**
   * POST /reports/invoices - Unified endpoint for invoice reports
   * Supports: Table load, Apply Filters, Pagination, Export
   */
  @Post('invoices')
  @RequirePermissions('INVOICE_VIEW')
  async getInvoiceReport(
    @Body() filters: InvoiceReportRequestDto,
  ) {
    try {
      // Normalize filter DTO (map legacy fields to new fields)
      const normalizedFilters = this.normalizeFilters(filters);
      
      const result = await this.invoiceReportQueryService.getInvoiceReport(normalizedFilters);
      
      // Handle export requests
      if (normalizedFilters.export) {
        // TODO: Implement export functionality (PDF, Excel, CSV)
        // For now, return the data - export logic can be added later
        // This would typically generate a file and return it as a stream
        throw new BadRequestException('Export functionality not yet implemented');
      }

      // Wrap response to match API pattern
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to generate invoice report',
      );
    }
  }

  /**
   * GET /reports/invoices - Legacy endpoint for backward compatibility
   * Maps query params to DTO and calls POST handler
   */
  @Get('invoices')
  @RequirePermissions('INVOICE_VIEW')
  async getInvoiceReportLegacy(
    @Query() query: InvoiceReportRequestDto,
  ) {
    // Convert query params to body format and call POST handler
    return this.getInvoiceReport(query);
  }

  @Post('route-trip')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getRouteTripReport(
    @Body() filters: RouteTripReportRequestDto,
  ) {
    const result = await this.routeTripReportQueryService.getRouteTripReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('route-trip')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getRouteTripReportLegacy(
    @Query() query: RouteTripReportRequestDto,
  ) {
    return this.getRouteTripReport(query);
  }

  @Post('missed-route-schedule')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getMissedRouteScheduleReport(
    @Body() filters: MissedRouteScheduleRequestDto,
  ) {
    const result = await this.missedRouteScheduleQueryService.getMissedRouteSchedule(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('missed-route-schedule')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getMissedRouteScheduleReportLegacy(
    @Query() query: MissedRouteScheduleRequestDto,
  ) {
    return this.getMissedRouteScheduleReport(query);
  }

  @Post('hcf-waste-collection-history')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getHcfWasteCollectionHistoryReport(
    @Body() filters: HcfWasteCollectionHistoryRequestDto,
  ) {
    const result = await this.hcfWasteCollectionHistoryQueryService.getReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('hcf-waste-collection-history')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getHcfWasteCollectionHistoryReportLegacy(
    @Query() query: HcfWasteCollectionHistoryRequestDto,
  ) {
    return this.getHcfWasteCollectionHistoryReport(query);
  }

  @Post('cost-analysis')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getCostAnalysisReport(
    @Body() filters: CostAnalysisReportRequestDto,
  ) {
    const result = await this.costAnalysisReportQueryService.getCostAnalysisReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('cost-analysis')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getCostAnalysisReportLegacy(
    @Query() query: CostAnalysisReportRequestDto,
  ) {
    return this.getCostAnalysisReport(query);
  }

  @Post('hcf-ledger-statement')
  @RequirePermissions('INVOICE_VIEW')
  async getHcfLedgerStatementReport(
    @Body() filters: HcfLedgerStatementRequestDto,
  ) {
    const result = await this.hcfLedgerStatementQueryService.getReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('hcf-ledger-statement')
  @RequirePermissions('INVOICE_VIEW')
  async getHcfLedgerStatementReportLegacy(
    @Query() query: HcfLedgerStatementRequestDto,
  ) {
    return this.getHcfLedgerStatementReport(query);
  }

  @Post('operator-pcb-collection')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getOperatorPcbReport(
    @Body() filters: OperatorPcbReportRequestDto,
  ) {
    const result = await this.operatorPcbReportQueryService.getReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('operator-pcb-collection')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getOperatorPcbReportLegacy(
    @Query() query: OperatorPcbReportRequestDto,
  ) {
    return this.getOperatorPcbReport(query);
  }

  @Post('pcb-compliance')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getPcbComplianceReport(
    @Body() filters: PcbComplianceReportRequestDto,
  ) {
    const result = await this.pcbComplianceReportQueryService.getReport(filters || {});
    return {
      success: true,
      data: result,
    };
  }

  @Get('pcb-compliance')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getPcbComplianceReportLegacy(
    @Query() query: PcbComplianceReportRequestDto,
  ) {
    return this.getPcbComplianceReport(query);
  }

  @Post('waste-collection-summary')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getWasteCollectionSummaryReport(
    @Body() filters: WasteCollectionSummaryReportRequestDto,
  ) {
    const result = await this.wasteCollectionSummaryReportQueryService.getReport(filters || ({} as WasteCollectionSummaryReportRequestDto));
    return {
      success: true,
      data: result,
    };
  }

  @Get('waste-collection-summary')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async getWasteCollectionSummaryReportLegacy(
    @Query() query: WasteCollectionSummaryReportRequestDto,
  ) {
    return this.getWasteCollectionSummaryReport(query);
  }

  @Post('export')
  @RequirePermissions('INVOICE_VIEW')
  async exportReport(
    @Body() body: ReportExportRequestDto,
  ) {
    const reportType = body.reportType;
    const format = body.format;
    const filters = body.filters || {};

    if (reportType === 'invoice') {
      const normalizedFilters = this.normalizeFilters(filters as InvoiceReportRequestDto);
      const result = await this.invoiceReportQueryService.getInvoiceReport(normalizedFilters);
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'route-trip') {
      const result = await this.routeTripReportQueryService.getRouteTripReport(
        filters as RouteTripReportRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'missed-route-schedule') {
      const result = await this.missedRouteScheduleQueryService.getMissedRouteSchedule(
        filters as MissedRouteScheduleRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'hcf-waste-collection-history') {
      const result = await this.hcfWasteCollectionHistoryQueryService.getReport(
        filters as HcfWasteCollectionHistoryRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'cost-analysis') {
      const result = await this.costAnalysisReportQueryService.getCostAnalysisReport(
        filters as CostAnalysisReportRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'hcf-ledger-statement') {
      const result = await this.hcfLedgerStatementQueryService.getReport(
        filters as HcfLedgerStatementRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'operator-pcb-collection') {
      const result = await this.operatorPcbReportQueryService.getReport(
        filters as OperatorPcbReportRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'pcb-compliance') {
      const result = await this.pcbComplianceReportQueryService.getReport(
        filters as PcbComplianceReportRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    if (reportType === 'waste-collection-summary') {
      const result = await this.wasteCollectionSummaryReportQueryService.getReport(
        filters as WasteCollectionSummaryReportRequestDto,
      );
      return {
        success: true,
        data: {
          reportType,
          format,
          payload: result,
        },
      };
    }

    throw new BadRequestException('Unsupported reportType');
  }

  /**
   * Normalize filter DTO - maps legacy field names to new field names
   */
  private normalizeFilters(filters: InvoiceReportRequestDto): InvoiceReportRequestDto {
    const normalized = { ...filters };
    
    // Map legacy fields to new fields
    if (normalized.fromDate && !normalized.invoiceFromDate) {
      normalized.invoiceFromDate = normalized.fromDate;
    }
    if (normalized.toDate && !normalized.invoiceToDate) {
      normalized.invoiceToDate = normalized.toDate;
    }
    if (normalized.search && !normalized.searchText) {
      normalized.searchText = normalized.search;
    }
    if (normalized.sortDir && !normalized.sortOrder) {
      normalized.sortOrder = normalized.sortDir;
    }
    
    return normalized;
  }
}
