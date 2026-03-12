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
import { CreatePlaceholderMasterUseCase } from '../application/use-cases/create-placeholder-master.use-case';
import { GetPlaceholderMasterUseCase } from '../application/use-cases/get-placeholder-master.use-case';
import { GetAllPlaceholderMasterUseCase } from '../application/use-cases/get-all-placeholder-master.use-case';
import { UpdatePlaceholderMasterUseCase } from '../application/use-cases/update-placeholder-master.use-case';
import { DeletePlaceholderMasterUseCase } from '../application/use-cases/delete-placeholder-master.use-case';
import { CreatePlaceholderMasterDto } from '../application/dto/create-placeholder-master.dto';
import { UpdatePlaceholderMasterDto } from '../application/dto/update-placeholder-master.dto';
import { PlaceholderMasterResponseDto } from '../application/dto/placeholder-master-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('placeholder-master')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class PlaceholderMasterController {
  constructor(
    private readonly createPlaceholderMasterUseCase: CreatePlaceholderMasterUseCase,
    private readonly getPlaceholderMasterUseCase: GetPlaceholderMasterUseCase,
    private readonly getAllPlaceholderMasterUseCase: GetAllPlaceholderMasterUseCase,
    private readonly updatePlaceholderMasterUseCase: UpdatePlaceholderMasterUseCase,
    private readonly deletePlaceholderMasterUseCase: DeletePlaceholderMasterUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('PLACEHOLDER_MASTER_CREATE')
  async create(@Body() createPlaceholderDto: CreatePlaceholderMasterDto, @Request() req: any) {
    const placeholder = await this.createPlaceholderMasterUseCase.execute(
      createPlaceholderDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(placeholder),
      message: 'Placeholder Master created successfully',
    };
  }

  @Get()
  @RequirePermissions('PLACEHOLDER_MASTER_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const placeholders = await this.getAllPlaceholderMasterUseCase.execute(
      activeOnly === 'true',
    );
    return {
      success: true,
      data: placeholders.map((p) => this.toResponseDto(p)),
      message: 'Placeholder Master retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('PLACEHOLDER_MASTER_VIEW')
  async findOne(@Param('id') id: string) {
    const placeholder = await this.getPlaceholderMasterUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(placeholder),
      message: 'Placeholder Master retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('PLACEHOLDER_MASTER_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updatePlaceholderDto: UpdatePlaceholderMasterDto,
    @Request() req: any,
  ) {
    const placeholder = await this.updatePlaceholderMasterUseCase.execute(
      id,
      updatePlaceholderDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(placeholder),
      message: 'Placeholder Master updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('PLACEHOLDER_MASTER_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deletePlaceholderMasterUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(placeholder: any): PlaceholderMasterResponseDto {
    return {
      id: placeholder.placeholderId,
      placeholderCode: placeholder.placeholderCode,
      placeholderDescription: placeholder.placeholderDescription,
      sourceTable: placeholder.sourceTable,
      sourceColumn: placeholder.sourceColumn,
      status: placeholder.status,
      createdBy: placeholder.createdBy,
      createdOn: placeholder.createdOn.toISOString(),
      modifiedBy: placeholder.modifiedBy,
      modifiedOn: placeholder.modifiedOn.toISOString(),
    };
  }
}
