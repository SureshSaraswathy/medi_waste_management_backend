import {
  Controller,
  Get,
  Post,
  Put,
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
import { CreateWasteCollectionUseCase } from '../application/use-cases/create-waste-collection.use-case';
import { GetWasteCollectionUseCase } from '../application/use-cases/get-waste-collection.use-case';
import { GetAllWasteCollectionsUseCase } from '../application/use-cases/get-all-waste-collections.use-case';
import { UpdateWasteCollectionUseCase } from '../application/use-cases/update-waste-collection.use-case';
import { DeleteWasteCollectionUseCase } from '../application/use-cases/delete-waste-collection.use-case';
import { LookupBarcodeUseCase } from '../application/use-cases/lookup-barcode.use-case';
import { CollectWasteUseCase } from '../application/use-cases/collect-waste.use-case';
import { CreateWasteCollectionDto } from '../application/dto/create-waste-collection.dto';
import { UpdateWasteCollectionDto } from '../application/dto/update-waste-collection.dto';
import { WasteCollectionResponseDto } from '../application/dto/waste-collection-response.dto';
import { BarcodeLookupResponseDto } from '../application/dto/barcode-lookup-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('waste-collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class WasteCollectionController {
  constructor(
    private readonly createWasteCollectionUseCase: CreateWasteCollectionUseCase,
    private readonly getWasteCollectionUseCase: GetWasteCollectionUseCase,
    private readonly getAllWasteCollectionsUseCase: GetAllWasteCollectionsUseCase,
    private readonly updateWasteCollectionUseCase: UpdateWasteCollectionUseCase,
    private readonly deleteWasteCollectionUseCase: DeleteWasteCollectionUseCase,
    private readonly lookupBarcodeUseCase: LookupBarcodeUseCase,
    private readonly collectWasteUseCase: CollectWasteUseCase,
  ) {}

  @Get('barcode/:barcode')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async lookupBarcode(@Param('barcode') barcode: string) {
    const lookupResult = await this.lookupBarcodeUseCase.execute(barcode);
    return {
      success: true,
      data: lookupResult,
      message: 'Barcode lookup successful',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('WASTE_COLLECTION_CREATE')
  async create(@Body() createWasteCollectionDto: CreateWasteCollectionDto, @Request() req: any) {
    const wasteCollection = await this.createWasteCollectionUseCase.execute(
      createWasteCollectionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(wasteCollection),
      message: 'Waste collection created successfully',
    };
  }

  @Post(':id/collect')
  @RequirePermissions('WASTE_COLLECTION_EDIT')
  async collect(
    @Param('id') id: string,
    @Body() body: { weightKg: number },
    @Request() req: any,
  ) {
    const wasteCollection = await this.collectWasteUseCase.execute(
      id,
      body.weightKg,
      req.user?.userId || '',
    );
    return {
      success: true,
      data: this.toResponseDto(wasteCollection),
      message: 'Waste collected successfully',
    };
  }

  @Get()
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('hcfId') hcfId?: string,
    @Query('date') date?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('routeAssignmentId') routeAssignmentId?: string,
  ) {
    try {
      const wasteCollections = await this.getAllWasteCollectionsUseCase.execute(
        companyId,
        hcfId,
        date,
        endDate,
        status,
        routeAssignmentId,
      );
      
      if (!wasteCollections || !Array.isArray(wasteCollections)) {
        console.error('[WasteCollectionController] Invalid wasteCollections data:', wasteCollections);
        return {
          success: true,
          data: [],
          message: 'Waste collections retrieved successfully',
        };
      }

      const mappedWasteCollections = wasteCollections.map((wc) => {
        try {
          return this.toResponseDto(wc);
        } catch (dtoError) {
          console.error('[WasteCollectionController] Error mapping wasteCollection to DTO:', dtoError, 'WasteCollection:', wc);
          return null;
        }
      }).filter((wc) => wc !== null);

      return {
        success: true,
        data: mappedWasteCollections,
        message: 'Waste collections retrieved successfully',
      };
    } catch (error) {
      console.error('[WasteCollectionController] Error in findAll:', error);
      console.error('[WasteCollectionController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('WASTE_COLLECTION_VIEW')
  async findOne(@Param('id') id: string) {
    const wasteCollection = await this.getWasteCollectionUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(wasteCollection),
      message: 'Waste collection retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('WASTE_COLLECTION_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateWasteCollectionDto: UpdateWasteCollectionDto,
    @Request() req: any,
  ) {
    const wasteCollection = await this.updateWasteCollectionUseCase.execute(
      id,
      updateWasteCollectionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(wasteCollection),
      message: 'Waste collection updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('WASTE_COLLECTION_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteWasteCollectionUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(wasteCollection: any): WasteCollectionResponseDto {
    if (!wasteCollection) {
      throw new Error('WasteCollection is null or undefined');
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

    const formatDate = (date: any): string => {
      if (!date) return new Date().toISOString().split('T')[0];
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
          return new Date().toISOString().split('T')[0];
        }
        return parsed.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    };

    const wasteCollectionId = wasteCollection.id || wasteCollection.wasteCollectionId;
    if (!wasteCollectionId) {
      console.error('[WasteCollectionController] WasteCollection missing id:', wasteCollection);
      throw new Error('WasteCollection missing id property');
    }

    return {
      id: wasteCollectionId,
      barcode: wasteCollection.barcode || '',
      collectionDate: formatDate(wasteCollection.collectionDate),
      companyId: wasteCollection.companyId || '',
      hcfId: wasteCollection.hcfId || '',
      wasteColor: wasteCollection.wasteColor || 'Yellow',
      weightKg: wasteCollection.weightKg || undefined,
      status: wasteCollection.status || 'Pending',
      routeAssignmentId: wasteCollection.routeAssignmentId || undefined,
      collectedBy: wasteCollection.collectedBy || undefined,
      collectedAt: wasteCollection.collectedAt ? formatDateTime(wasteCollection.collectedAt) : undefined,
      notes: wasteCollection.notes || undefined,
      createdBy: wasteCollection.createdBy || undefined,
      createdOn: formatDateTime(wasteCollection.createdOn),
      modifiedBy: wasteCollection.modifiedBy || undefined,
      modifiedOn: formatDateTime(wasteCollection.modifiedOn),
    };
  }
}
