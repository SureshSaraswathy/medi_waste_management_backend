import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportRequestDto } from '../application/dto/export-request.dto';
import { ExportService } from '../application/services/export.service';
import { ExportValidator } from '../application/validators/export.validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { ExportDataProviderRegistry } from '../application/services/export-data-provider-registry.service';
import { IExportDataProvider } from '../domain/interfaces/export-data-provider.interface';

/**
 * Common Export Controller
 * Handles export requests for all modules
 */
@Controller('export')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly validator: ExportValidator,
    private readonly dataProviderRegistry: ExportDataProviderRegistry,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('EXPORT_VIEW') // Add this permission to your permissions list
  async export(@Body() dto: ExportRequestDto, @Request() req: any, @Res() res: Response) {
    try {
      // 1. Common validation - stops immediately if fails (no DB call, no file generation)
      this.validator.validateCommonRequirements(dto);

      // 2. Get module-specific data provider
      const dataProvider = this.dataProviderRegistry.getProvider(dto.module);
      if (!dataProvider) {
        throw new BadRequestException(`No data provider found for module: ${dto.module}`);
      }

      // 3. Module-specific validation (permissions, company/HCF access)
      // This should be done by the data provider or a separate validator
      // For now, we'll assume the data provider handles it

      // 4. Get estimated record count to decide sync vs async
      const estimatedCount = await dataProvider.getEstimatedRecordCount(dto);
      const userId = req.user?.userId || 'anonymous';

      // 5. Export (sync for small data, async for large)
      if (this.validator.shouldUseAsyncExport(estimatedCount)) {
        const result = await this.exportService.exportAsync(dto, dataProvider, userId);
        return res.json({
          success: true,
          data: result,
          message: result.message,
        });
      } else {
        const result = await this.exportService.exportSync(dto, dataProvider, userId);
        
        // Set response headers for file download
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.setHeader('Content-Length', result.buffer.length);

        return res.send(result.buffer);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Export failed: ${error.message}`);
    }
  }
}
