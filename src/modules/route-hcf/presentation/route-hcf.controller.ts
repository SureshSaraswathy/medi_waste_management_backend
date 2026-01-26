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
import { CreateRouteHcfUseCase } from '../application/use-cases/create-route-hcf.use-case';
import { GetRouteHcfUseCase } from '../application/use-cases/get-route-hcf.use-case';
import { GetAllRouteHcfsUseCase } from '../application/use-cases/get-all-route-hcfs.use-case';
import { UpdateRouteHcfUseCase } from '../application/use-cases/update-route-hcf.use-case';
import { DeleteRouteHcfUseCase } from '../application/use-cases/delete-route-hcf.use-case';
import { CreateRouteHcfDto } from '../application/dto/create-route-hcf.dto';
import { UpdateRouteHcfDto } from '../application/dto/update-route-hcf.dto';
import { RouteHcfResponseDto } from '../application/dto/route-hcf-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('route-hcf-mappings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class RouteHcfController {
  constructor(
    private readonly createRouteHcfUseCase: CreateRouteHcfUseCase,
    private readonly getRouteHcfUseCase: GetRouteHcfUseCase,
    private readonly getAllRouteHcfsUseCase: GetAllRouteHcfsUseCase,
    private readonly updateRouteHcfUseCase: UpdateRouteHcfUseCase,
    private readonly deleteRouteHcfUseCase: DeleteRouteHcfUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ROUTE_HCF_CREATE')
  async create(@Body() createRouteHcfDto: CreateRouteHcfDto, @Request() req: any) {
    const routeHcf = await this.createRouteHcfUseCase.execute(
      createRouteHcfDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(routeHcf),
      message: 'Route HCF mapping created successfully',
    };
  }

  @Get()
  @RequirePermissions('ROUTE_HCF_VIEW')
  async findAll(
    @Query('routeId') routeId?: string,
    @Query('hcfId') hcfId?: string,
    @Query('companyId') companyId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    try {
      const routeHcfs = await this.getAllRouteHcfsUseCase.execute(
        routeId,
        hcfId,
        companyId,
        activeOnly === 'true',
      );
      
      if (!routeHcfs || !Array.isArray(routeHcfs)) {
        console.error('[RouteHcfController] Invalid routeHcfs data:', routeHcfs);
        return {
          success: true,
          data: [],
          message: 'Route HCF mappings retrieved successfully',
        };
      }

      const mappedRouteHcfs = routeHcfs.map((r) => {
        try {
          return this.toResponseDto(r);
        } catch (dtoError) {
          console.error('[RouteHcfController] Error mapping routeHcf to DTO:', dtoError, 'RouteHcf:', r);
          return null;
        }
      }).filter((r) => r !== null);

      return {
        success: true,
        data: mappedRouteHcfs,
        message: 'Route HCF mappings retrieved successfully',
      };
    } catch (error) {
      console.error('[RouteHcfController] Error in findAll:', error);
      console.error('[RouteHcfController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('ROUTE_HCF_VIEW')
  async findOne(@Param('id') id: string) {
    const routeHcf = await this.getRouteHcfUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(routeHcf),
      message: 'Route HCF mapping retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('ROUTE_HCF_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateRouteHcfDto: UpdateRouteHcfDto,
    @Request() req: any,
  ) {
    const routeHcf = await this.updateRouteHcfUseCase.execute(
      id,
      updateRouteHcfDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(routeHcf),
      message: 'Route HCF mapping updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('ROUTE_HCF_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteRouteHcfUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(routeHcf: any): RouteHcfResponseDto {
    if (!routeHcf) {
      throw new Error('RouteHcf is null or undefined');
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

    // Use id property directly (routeHcfId is a getter that returns id)
    const routeHcfId = routeHcf.id || routeHcf.routeHcfId;
    if (!routeHcfId) {
      console.error('[RouteHcfController] RouteHcf missing id:', routeHcf);
      throw new Error('RouteHcf missing id property');
    }

    return {
      id: routeHcfId,
      routeId: routeHcf.routeId || '',
      hcfId: routeHcf.hcfId || '',
      companyId: routeHcf.companyId || '',
      sequenceOrder: routeHcf.sequenceOrder || undefined,
      status: routeHcf.status || 'Active',
      createdBy: routeHcf.createdBy || null,
      createdOn: formatDateTime(routeHcf.createdOn),
      modifiedBy: routeHcf.modifiedBy || null,
      modifiedOn: formatDateTime(routeHcf.modifiedOn),
    };
  }
}
