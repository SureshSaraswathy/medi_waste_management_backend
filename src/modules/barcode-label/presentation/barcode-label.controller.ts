import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateBarcodeLabelUseCase } from '../application/use-cases/update-barcode-label.use-case';
import { CreateBarcodeLabelDto } from '../application/dto/create-barcode-label.dto';
import { UpdateBarcodeLabelDto } from '../application/dto/update-barcode-label.dto';
import { BarcodeLabelResponseDto } from '../application/dto/barcode-label-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { BarcodeType } from '../infrastructure/transaction/barcode-label.entity';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../domain/interfaces/barcode-label.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../hcf/domain/interfaces/hcf.repository.interface';
import { Inject } from '@nestjs/common';

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
    private readonly updateBarcodeLabelUseCase: UpdateBarcodeLabelUseCase,
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
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
  async getLastSequence() {
    const lastSequence = await this.getLastSequenceUseCase.execute();
    return {
      success: true,
      data: { lastSequence },
      message: 'Last sequence number retrieved successfully',
    };
  }

  @Get('list')
  @RequirePermissions('BARCODE_LABEL_VIEW')
  async getList(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search?: string,
    @Query('colorBlock') colorBlock?: string,
    @Query('barcodeType') barcodeType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const result = await this.barcodeLabelRepository.findWithPagination({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      colorBlock,
      barcodeType: barcodeType as BarcodeType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeDeleted: includeDeleted === 'true',
    });
    
    // Batch fetch HCF names for all labels (single query instead of N queries)
    const hcfIds = [...new Set(result.data.map(label => label.hcfId))];
    const hcfMap = new Map<string, string>();
    
    if (hcfIds.length > 0) {
      // Batch fetch HCFs - get only hcfId and hcfName
      const hcfs = await Promise.all(
        hcfIds.map(id => this.hcfRepository.findById(id))
      );
      
      hcfs.forEach(hcf => {
        if (hcf) {
          hcfMap.set(hcf.hcfId, hcf.hcfName);
        }
      });
    }
    
    // Map labels with HCF names
    const labelsWithHcfNames = result.data.map(label => {
      const dto = this.toResponseDto(label);
      (dto as any).hcfName = hcfMap.get(label.hcfId) || '';
      return dto;
    });
    
    return {
      success: true,
      data: labelsWithHcfNames,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
      message: 'Barcode labels retrieved successfully',
    };
  }

  @Get('summary')
  @RequirePermissions('BARCODE_LABEL_VIEW')
  async getSummary() {
    const counts = await this.barcodeLabelRepository.getTotalCounts();
    return {
      success: true,
      data: counts,
      message: 'Summary retrieved successfully',
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('BARCODE_LABEL_UPDATE')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBarcodeLabelDto,
    @Request() req: any,
  ) {
    const label = await this.updateBarcodeLabelUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(label),
      message: 'Barcode label updated successfully',
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
      status: (label as any).status || 'Active',
      createdBy: label.createdBy || undefined,
      createdOn: formatDateTime(label.createdOn),
      hcfName: (label as any).hcfName || '',
    };
  }
}
