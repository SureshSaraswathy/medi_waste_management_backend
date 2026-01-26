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
import { CreateRouteAssignmentUseCase } from '../application/use-cases/create-route-assignment.use-case';
import { GetRouteAssignmentUseCase } from '../application/use-cases/get-route-assignment.use-case';
import { GetAllRouteAssignmentsUseCase } from '../application/use-cases/get-all-route-assignments.use-case';
import { UpdateRouteAssignmentUseCase } from '../application/use-cases/update-route-assignment.use-case';
import { DeleteRouteAssignmentUseCase } from '../application/use-cases/delete-route-assignment.use-case';
import { CreateRouteAssignmentDto } from '../application/dto/create-route-assignment.dto';
import { UpdateRouteAssignmentDto } from '../application/dto/update-route-assignment.dto';
import { RouteAssignmentResponseDto } from '../application/dto/route-assignment-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('route-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class RouteAssignmentController {
  constructor(
    private readonly createRouteAssignmentUseCase: CreateRouteAssignmentUseCase,
    private readonly getRouteAssignmentUseCase: GetRouteAssignmentUseCase,
    private readonly getAllRouteAssignmentsUseCase: GetAllRouteAssignmentsUseCase,
    private readonly updateRouteAssignmentUseCase: UpdateRouteAssignmentUseCase,
    private readonly deleteRouteAssignmentUseCase: DeleteRouteAssignmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ROUTE_ASSIGNMENT_CREATE')
  async create(@Body() createRouteAssignmentDto: CreateRouteAssignmentDto, @Request() req: any) {
    const routeAssignment = await this.createRouteAssignmentUseCase.execute(
      createRouteAssignmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(routeAssignment),
      message: 'Route assignment created successfully',
    };
  }

  @Get()
  @RequirePermissions('ROUTE_ASSIGNMENT_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    try {
      const routeAssignments = await this.getAllRouteAssignmentsUseCase.execute(
        companyId,
        date,
        status,
      );
      
      if (!routeAssignments || !Array.isArray(routeAssignments)) {
        console.error('[RouteAssignmentController] Invalid routeAssignments data:', routeAssignments);
        return {
          success: true,
          data: [],
          message: 'Route assignments retrieved successfully',
        };
      }

      const mappedRouteAssignments = routeAssignments.map((ra) => {
        try {
          return this.toResponseDto(ra);
        } catch (dtoError) {
          console.error('[RouteAssignmentController] Error mapping routeAssignment to DTO:', dtoError, 'RouteAssignment:', ra);
          return null;
        }
      }).filter((ra) => ra !== null);

      return {
        success: true,
        data: mappedRouteAssignments,
        message: 'Route assignments retrieved successfully',
      };
    } catch (error) {
      console.error('[RouteAssignmentController] Error in findAll:', error);
      console.error('[RouteAssignmentController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('ROUTE_ASSIGNMENT_VIEW')
  async findOne(@Param('id') id: string) {
    const routeAssignment = await this.getRouteAssignmentUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(routeAssignment),
      message: 'Route assignment retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('ROUTE_ASSIGNMENT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateRouteAssignmentDto: UpdateRouteAssignmentDto,
    @Request() req: any,
  ) {
    const routeAssignment = await this.updateRouteAssignmentUseCase.execute(
      id,
      updateRouteAssignmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(routeAssignment),
      message: 'Route assignment updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('ROUTE_ASSIGNMENT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteRouteAssignmentUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(routeAssignment: any): RouteAssignmentResponseDto {
    if (!routeAssignment) {
      throw new Error('RouteAssignment is null or undefined');
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

    // Use id property directly (routeAssignmentId is a getter that returns id)
    const routeAssignmentId = routeAssignment.id || routeAssignment.routeAssignmentId;
    if (!routeAssignmentId) {
      console.error('[RouteAssignmentController] RouteAssignment missing id:', routeAssignment);
      throw new Error('RouteAssignment missing id property');
    }

    return {
      id: routeAssignmentId,
      assignmentDate: formatDate(routeAssignment.assignmentDate),
      routeId: routeAssignment.routeId || '',
      vehicleId: routeAssignment.vehicleId || '',
      driverId: routeAssignment.driverId || '',
      pickerId: routeAssignment.pickerId || undefined,
      supervisorId: routeAssignment.supervisorId || undefined,
      companyId: routeAssignment.companyId || '',
      status: routeAssignment.status || 'Draft',
      notes: routeAssignment.notes || undefined,
      createdBy: routeAssignment.createdBy || undefined,
      createdOn: formatDateTime(routeAssignment.createdOn),
      modifiedBy: routeAssignment.modifiedBy || undefined,
      modifiedOn: formatDateTime(routeAssignment.modifiedOn),
    };
  }
}
