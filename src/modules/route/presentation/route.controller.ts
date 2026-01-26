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
import { CreateRouteUseCase } from '../application/use-cases/create-route.use-case';
import { GetRouteUseCase } from '../application/use-cases/get-route.use-case';
import { GetAllRoutesUseCase } from '../application/use-cases/get-all-routes.use-case';
import { UpdateRouteUseCase } from '../application/use-cases/update-route.use-case';
import { DeleteRouteUseCase } from '../application/use-cases/delete-route.use-case';
import { CreateRouteDto } from '../application/dto/create-route.dto';
import { UpdateRouteDto } from '../application/dto/update-route.dto';
import { RouteResponseDto } from '../application/dto/route-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('routes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class RouteController {
  constructor(
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly getRouteUseCase: GetRouteUseCase,
    private readonly getAllRoutesUseCase: GetAllRoutesUseCase,
    private readonly updateRouteUseCase: UpdateRouteUseCase,
    private readonly deleteRouteUseCase: DeleteRouteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ROUTE_CREATE')
  async create(@Body() createRouteDto: CreateRouteDto, @Request() req: any) {
    const route = await this.createRouteUseCase.execute(
      createRouteDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(route),
      message: 'Route created successfully',
    };
  }

  @Get()
  @RequirePermissions('ROUTE_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    try {
      const routes = await this.getAllRoutesUseCase.execute(companyId, activeOnly === 'true');
      
      if (!routes || !Array.isArray(routes)) {
        console.error('[RouteController] Invalid routes data:', routes);
        return {
          success: true,
          data: [],
          message: 'Routes retrieved successfully',
        };
      }

      const mappedRoutes = routes.map((r) => {
        try {
          return this.toResponseDto(r);
        } catch (dtoError) {
          console.error('[RouteController] Error mapping route to DTO:', dtoError, 'Route:', r);
          return null;
        }
      }).filter((r) => r !== null);

      return {
        success: true,
        data: mappedRoutes,
        message: 'Routes retrieved successfully',
      };
    } catch (error) {
      console.error('[RouteController] Error in findAll:', error);
      console.error('[RouteController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('ROUTE_VIEW')
  async findOne(@Param('id') id: string) {
    const route = await this.getRouteUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(route),
      message: 'Route retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('ROUTE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
    @Request() req: any,
  ) {
    const route = await this.updateRouteUseCase.execute(
      id,
      updateRouteDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(route),
      message: 'Route updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('ROUTE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteRouteUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(route: any): RouteResponseDto {
    if (!route) {
      throw new Error('Route is null or undefined');
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

    // Use id property directly (routeId is a getter that returns id)
    const routeId = route.id || route.routeId;
    if (!routeId) {
      console.error('[RouteController] Route missing id:', route);
      throw new Error('Route missing id property');
    }

    return {
      id: routeId,
      routeCode: route.routeCode || '',
      routeName: route.routeName || '',
      companyId: route.companyId || '',
      frequencyId: route.frequencyId || undefined,
      status: route.status || 'Active',
      createdBy: route.createdBy || null,
      createdOn: formatDateTime(route.createdOn),
      modifiedBy: route.modifiedBy || null,
      modifiedOn: formatDateTime(route.modifiedOn),
    };
  }
}
