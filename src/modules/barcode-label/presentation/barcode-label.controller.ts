import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { GenerateBarcodeLabelsUseCase } from '../application/use-cases/generate-barcode-labels.use-case';
import { GetBarcodeLabelUseCase } from '../application/use-cases/get-barcode-label.use-case';
import { GetAllBarcodeLabelsUseCase } from '../application/use-cases/get-all-barcode-labels.use-case';
import { GetLastSequenceUseCase } from '../application/use-cases/get-last-sequence.use-case';
import { DeleteBarcodeLabelUseCase } from '../application/use-cases/delete-barcode-label.use-case';
import { CreateBarcodeLabelDto } from '../application/dto/create-barcode-label.dto';
import { BarcodeLabelResponseDto } from '../application/dto/barcode-label-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { BarcodeType } from '../infrastructure/transaction/barcode-label.entity';

@Controller('barcode-labels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class BarcodeLabelController {
  constructor(
    private readonly generateBarcodeLabelsUseCase: GenerateBarcodeLabelsUseCase,
    private readonly getBarcodeLabelUseCase: GetBarcodeLabelUseCase,
    private readonly getAllBarcodeLabelsUseCase: GetAllBarcodeLabelsUseCase,
    private readonly getLastSequenceUseCase: GetLastSequenceUseCase,
    private readonly deleteBarcodeLabelUseCase: DeleteBarcodeLabelUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('BARCODE_LABEL_CREATE')
  async create(@Body() createBarcodeLabelDto: CreateBarcodeLabelDto, @Request() req: any) {
    const labels = await this.generateBarcodeLabelsUseCase.execute(
      createBarcodeLabelDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: labels.map(label => this.toResponseDto(label)),
      message: `${labels.length} barcode label(s) generated successfully`,
    };
  }

  @Get('last-sequence')
  @RequirePermissions('BARCODE_LABEL_VIEW')
  async getLastSequence(
    @Query('hcfCode') hcfCode: string,
    @Query('barcodeType') barcodeType: string,
  ) {
    const lastSequence = await this.getLastSequenceUseCase.execute(
      hcfCode,
      barcodeType as BarcodeType,
    );
    return {
      success: true,
      data: { lastSequence },
      message: 'Last sequence number retrieved successfully',
    };
  }

  @Get()
  @RequirePermissions('BARCODE_LABEL_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('hcfId') hcfId?: string,
    @Query('hcfCode') hcfCode?: string,
    @Query('barcodeType') barcodeType?: string,
  ) {
    try {
      const labels = await this.getAllBarcodeLabelsUseCase.execute(
        companyId,
        hcfId,
        hcfCode,
        barcodeType,
      );
      
      if (!labels || !Array.isArray(labels)) {
        console.error('[BarcodeLabelController] Invalid labels data:', labels);
        return {
          success: true,
          data: [],
          message: 'Barcode labels retrieved successfully',
        };
      }

      const mappedLabels = labels.map((label) => {
        try {
          return this.toResponseDto(label);
        } catch (dtoError) {
          console.error('[BarcodeLabelController] Error mapping label to DTO:', dtoError, 'Label:', label);
          return null;
        }
      }).filter((label) => label !== null);

      return {
        success: true,
        data: mappedLabels,
        message: 'Barcode labels retrieved successfully',
      };
    } catch (error) {
      console.error('[BarcodeLabelController] Error in findAll:', error);
      console.error('[BarcodeLabelController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('BARCODE_LABEL_VIEW')
  async findOne(@Param('id') id: string) {
    const label = await this.getBarcodeLabelUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(label),
      message: 'Barcode label retrieved successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('BARCODE_LABEL_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteBarcodeLabelUseCase.execute(id);
  }

  private toResponseDto(label: any): BarcodeLabelResponseDto {
    if (!label) {
      throw new Error('BarcodeLabel is null or undefined');
    }

    const formatDateTime = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) {
        return date.toISOString();
      }
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
          return new Date().toISOString();
        }
        return parsed.toISOString();
      }
      return new Date().toISOString();
    };

    const labelId = label.id || label.barcodeLabelId;
    if (!labelId) {
      console.error('[BarcodeLabelController] BarcodeLabel missing id:', label);
      throw new Error('BarcodeLabel missing id property');
    }

    return {
      id: labelId,
      hcfCode: label.hcfCode || '',
      hcfId: label.hcfId || '',
      companyId: label.companyId || '',
      sequenceNumber: label.sequenceNumber || 0,
      barcodeValue: label.barcodeValue || '',
      barcodeType: label.barcodeType || 'Barcode',
      colorBlock: label.colorBlock || 'White',
      createdBy: label.createdBy || undefined,
      createdOn: formatDateTime(label.createdOn),
    };
  }
}
