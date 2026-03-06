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
import { CreateEquipmentUseCase } from '../application/use-cases/create-equipment.use-case';
import { GetEquipmentUseCase } from '../application/use-cases/get-equipment.use-case';
import { GetAllEquipmentUseCase } from '../application/use-cases/get-all-equipment.use-case';
import { UpdateEquipmentUseCase } from '../application/use-cases/update-equipment.use-case';
import { DeleteEquipmentUseCase } from '../application/use-cases/delete-equipment.use-case';
import { CreateEquipmentDto } from '../application/dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../application/dto/update-equipment.dto';
import { EquipmentResponseDto } from '../application/dto/equipment-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('equipment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class EquipmentController {
  constructor(
    private readonly createEquipmentUseCase: CreateEquipmentUseCase,
    private readonly getEquipmentUseCase: GetEquipmentUseCase,
    private readonly getAllEquipmentUseCase: GetAllEquipmentUseCase,
    private readonly updateEquipmentUseCase: UpdateEquipmentUseCase,
    private readonly deleteEquipmentUseCase: DeleteEquipmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('EQUIPMENT_CREATE')
  async create(@Body() createEquipmentDto: CreateEquipmentDto, @Request() req: any) {
    const equipment = await this.createEquipmentUseCase.execute(
      createEquipmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(equipment),
      message: 'Equipment created successfully',
    };
  }

  @Get()
  @RequirePermissions('EQUIPMENT_VIEW')
  async findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('companyId') companyId?: string,
  ) {
    const equipment = await this.getAllEquipmentUseCase.execute(
      activeOnly === 'true',
      companyId,
    );
    return {
      success: true,
      data: equipment.map((e) => this.toResponseDto(e)),
      message: 'Equipment retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('EQUIPMENT_VIEW')
  async findOne(@Param('id') id: string) {
    const equipment = await this.getEquipmentUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(equipment),
      message: 'Equipment retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('EQUIPMENT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @Request() req: any,
  ) {
    const equipment = await this.updateEquipmentUseCase.execute(
      id,
      updateEquipmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(equipment),
      message: 'Equipment updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('EQUIPMENT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteEquipmentUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(equipment: any): EquipmentResponseDto {
    return {
      id: equipment.equipmentId,
      companyId: equipment.companyId,
      equipmentCode: equipment.equipmentCode,
      equipmentName: equipment.equipmentName,
      equipmentType: equipment.equipmentType,
      make: equipment.make,
      capacity: equipment.capacity,
      status: equipment.status,
      createdBy: equipment.createdBy,
      createdOn: equipment.createdOn.toISOString(),
      modifiedBy: equipment.modifiedBy,
      modifiedOn: equipment.modifiedOn.toISOString(),
    };
  }
}
