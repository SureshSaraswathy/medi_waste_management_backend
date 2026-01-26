import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ExportRequestDto, ExportFileType } from '../dto/export-request.dto';
import { ExportResponseDto } from '../dto/export-response.dto';
import { ExportValidator } from '../validators/export.validator';
import { PdfGenerator } from '../../infrastructure/generators/pdf.generator';
import { ExcelGenerator } from '../../infrastructure/generators/excel.generator';
import { IExportDataProvider } from '../../domain/interfaces/export-data-provider.interface';
import { ExportAuditService } from './export-audit.service';

/**
 * Common Export Service
 * Orchestrates the export process without containing DB queries, validation, or business rules
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly validator: ExportValidator,
    private readonly pdfGenerator: PdfGenerator,
    private readonly excelGenerator: ExcelGenerator,
    private readonly auditService: ExportAuditService,
  ) {}

  /**
   * Export data synchronously (for small datasets)
   */
  async exportSync(
    dto: ExportRequestDto,
    dataProvider: IExportDataProvider,
    userId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string; recordCount: number }> {
    // 1. Common validation (already done in controller, but double-check)
    this.validator.validateCommonRequirements(dto);

    // 2. Load data using the data provider (no DB queries here)
    const data = await dataProvider.getDataForExport(dto);
    const recordCount = data.length;

    // 3. Get column definitions
    const columns = dataProvider.getColumnDefinitions();

    // 4. Generate file based on type
    let buffer: Buffer;
    let fileName: string;
    let mimeType: string;

    const options = {
      title: this.getExportTitle(dto),
      module: dto.module,
      filters: dto,
      dataProvider,
    };

    if (dto.fileType === ExportFileType.PDF) {
      buffer = await this.pdfGenerator.generate(data, columns, options);
      fileName = `${dto.module}_export_${new Date().toISOString().split('T')[0]}.pdf`;
      mimeType = this.pdfGenerator.getMimeType();
    } else {
      buffer = await this.excelGenerator.generate(data, columns, options);
      fileName = `${dto.module}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      mimeType = this.excelGenerator.getMimeType();
    }

    // 5. Log export in audit
    await this.auditService.logExport({
      module: dto.module,
      userId,
      filters: dto,
      recordCount,
      fileType: dto.fileType,
      fileName,
    });

    return { buffer, fileName, mimeType, recordCount };
  }

  /**
   * Export data asynchronously (for large datasets)
   */
  async exportAsync(
    dto: ExportRequestDto,
    dataProvider: IExportDataProvider,
    userId: string,
  ): Promise<ExportResponseDto> {
    // 1. Common validation
    this.validator.validateCommonRequirements(dto);

    // 2. Get estimated record count
    const estimatedCount = await dataProvider.getEstimatedRecordCount(dto);

    // 3. Check if async is needed
    if (!this.validator.shouldUseAsyncExport(estimatedCount)) {
      // Fall back to sync export
      const result = await this.exportSync(dto, dataProvider, userId);
      return {
        success: true,
        message: 'Export completed',
        fileName: result.fileName,
        recordCount: result.recordCount,
      };
    }

    // 4. Create async export job
    const exportId = `export_${Date.now()}_${userId}`;
    
    // In production, this would:
    // - Create a job in a queue (Bull, BullMQ, etc.)
    // - Return exportId immediately
    // - Process export in background
    // - Notify user when complete (email, websocket, etc.)

    // For now, return placeholder response
    return {
      success: true,
      message: 'Export job created. You will be notified when ready.',
      exportId,
      estimatedTime: Math.ceil(estimatedCount / 1000), // Rough estimate: 1 second per 1000 records
      recordCount: estimatedCount,
    };
  }

  /**
   * Get export title based on module and filters
   */
  private getExportTitle(dto: ExportRequestDto): string {
    const moduleName = dto.module.charAt(0).toUpperCase() + dto.module.slice(1);
    return `${moduleName} Export - ${dto.dateFrom} to ${dto.dateTo}`;
  }
}
