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
import { InvoiceReportResponseDto } from '../application/dto/invoice-report-response.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class ReportsController {
  constructor(
    private readonly invoiceReportQueryService: InvoiceReportQueryService,
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
