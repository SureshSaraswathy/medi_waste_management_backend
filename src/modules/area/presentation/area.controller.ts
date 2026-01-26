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
import { CreateAreaUseCase } from '../application/use-cases/create-area.use-case';
import { GetAreaUseCase } from '../application/use-cases/get-area.use-case';
import { GetAllAreasUseCase } from '../application/use-cases/get-all-areas.use-case';
import { UpdateAreaUseCase } from '../application/use-cases/update-area.use-case';
import { DeleteAreaUseCase } from '../application/use-cases/delete-area.use-case';
import { CreateAreaDto } from '../application/dto/create-area.dto';
import { UpdateAreaDto } from '../application/dto/update-area.dto';
import { AreaResponseDto } from '../application/dto/area-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('areas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AreaController {
  constructor(
    private readonly createAreaUseCase: CreateAreaUseCase,
    private readonly getAreaUseCase: GetAreaUseCase,
    private readonly getAllAreasUseCase: GetAllAreasUseCase,
    private readonly updateAreaUseCase: UpdateAreaUseCase,
    private readonly deleteAreaUseCase: DeleteAreaUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('AREA_CREATE')
  async create(@Body() createAreaDto: CreateAreaDto, @Request() req: any) {
    const area = await this.createAreaUseCase.execute(
      createAreaDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(area),
      message: 'Area created successfully',
    };
  }

  @Get()
  @RequirePermissions('AREA_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const areas = await this.getAllAreasUseCase.execute(activeOnly === 'true');
    return {
      success: true,
      data: areas.map((a) => this.toResponseDto(a)),
      message: 'Areas retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('AREA_VIEW')
  async findOne(@Param('id') id: string) {
    const area = await this.getAreaUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(area),
      message: 'Area retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('AREA_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
    @Request() req: any,
  ) {
    const area = await this.updateAreaUseCase.execute(
      id,
      updateAreaDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(area),
      message: 'Area updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('AREA_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteAreaUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(area: any): AreaResponseDto {
    return {
      id: area.areaId,
      areaCode: area.areaCode,
      areaName: area.areaName,
      areaPincode: area.areaPincode,
      status: area.status,
      createdBy: area.createdBy,
      createdOn: area.createdOn.toISOString(),
      modifiedBy: area.modifiedBy,
      modifiedOn: area.modifiedOn.toISOString(),
    };
  }
}
