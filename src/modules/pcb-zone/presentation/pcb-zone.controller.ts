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
import { CreatePcbZoneUseCase } from '../application/use-cases/create-pcb-zone.use-case';
import { GetPcbZoneUseCase } from '../application/use-cases/get-pcb-zone.use-case';
import { GetAllPcbZonesUseCase } from '../application/use-cases/get-all-pcb-zones.use-case';
import { UpdatePcbZoneUseCase } from '../application/use-cases/update-pcb-zone.use-case';
import { DeletePcbZoneUseCase } from '../application/use-cases/delete-pcb-zone.use-case';
import { CreatePcbZoneDto } from '../application/dto/create-pcb-zone.dto';
import { UpdatePcbZoneDto } from '../application/dto/update-pcb-zone.dto';
import { PcbZoneResponseDto } from '../application/dto/pcb-zone-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('pcb-zones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class PcbZoneController {
  constructor(
    private readonly createPcbZoneUseCase: CreatePcbZoneUseCase,
    private readonly getPcbZoneUseCase: GetPcbZoneUseCase,
    private readonly getAllPcbZonesUseCase: GetAllPcbZonesUseCase,
    private readonly updatePcbZoneUseCase: UpdatePcbZoneUseCase,
    private readonly deletePcbZoneUseCase: DeletePcbZoneUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('PCB_ZONE_CREATE')
  async create(@Body() createPcbZoneDto: CreatePcbZoneDto, @Request() req: any) {
    const pcbZone = await this.createPcbZoneUseCase.execute(
      createPcbZoneDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(pcbZone),
      message: 'PCB Zone created successfully',
    };
  }

  @Get()
  @RequirePermissions('PCB_ZONE_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const pcbZones = await this.getAllPcbZonesUseCase.execute(activeOnly === 'true');
    return {
      success: true,
      data: pcbZones.map((p) => this.toResponseDto(p)),
      message: 'PCB Zones retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('PCB_ZONE_VIEW')
  async findOne(@Param('id') id: string) {
    const pcbZone = await this.getPcbZoneUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(pcbZone),
      message: 'PCB Zone retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('PCB_ZONE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updatePcbZoneDto: UpdatePcbZoneDto,
    @Request() req: any,
  ) {
    const pcbZone = await this.updatePcbZoneUseCase.execute(
      id,
      updatePcbZoneDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(pcbZone),
      message: 'PCB Zone updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('PCB_ZONE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deletePcbZoneUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(pcbZone: any): PcbZoneResponseDto {
    return {
      id: pcbZone.pcbZoneId,
      pcbZoneName: pcbZone.pcbZoneName,
      pcbZoneAddress: pcbZone.pcbZoneAddress,
      contactNum: pcbZone.contactNum,
      contactEmail: pcbZone.contactEmail,
      alertEmail: pcbZone.alertEmail,
      status: pcbZone.status,
      createdBy: pcbZone.createdBy,
      createdOn: pcbZone.createdOn.toISOString(),
      modifiedBy: pcbZone.modifiedBy,
      modifiedOn: pcbZone.modifiedOn.toISOString(),
    };
  }
}
