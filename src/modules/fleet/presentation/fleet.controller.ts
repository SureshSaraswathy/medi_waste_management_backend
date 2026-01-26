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
import { CreateFleetUseCase } from '../application/use-cases/create-fleet.use-case';
import { GetFleetUseCase } from '../application/use-cases/get-fleet.use-case';
import { GetAllFleetsUseCase } from '../application/use-cases/get-all-fleets.use-case';
import { UpdateFleetUseCase } from '../application/use-cases/update-fleet.use-case';
import { DeleteFleetUseCase } from '../application/use-cases/delete-fleet.use-case';
import { CreateFleetDto } from '../application/dto/create-fleet.dto';
import { UpdateFleetDto } from '../application/dto/update-fleet.dto';
import { FleetResponseDto } from '../application/dto/fleet-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('fleets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class FleetController {
  constructor(
    private readonly createFleetUseCase: CreateFleetUseCase,
    private readonly getFleetUseCase: GetFleetUseCase,
    private readonly getAllFleetsUseCase: GetAllFleetsUseCase,
    private readonly updateFleetUseCase: UpdateFleetUseCase,
    private readonly deleteFleetUseCase: DeleteFleetUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('FLEET_CREATE')
  async create(@Body() createFleetDto: CreateFleetDto, @Request() req: any) {
    const fleet = await this.createFleetUseCase.execute(
      createFleetDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(fleet),
      message: 'Fleet created successfully',
    };
  }

  @Get()
  @RequirePermissions('FLEET_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const fleets = await this.getAllFleetsUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: fleets.map((f) => this.toResponseDto(f)),
      message: 'Fleets retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('FLEET_VIEW')
  async findOne(@Param('id') id: string) {
    const fleet = await this.getFleetUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(fleet),
      message: 'Fleet retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('FLEET_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateFleetDto: UpdateFleetDto,
    @Request() req: any,
  ) {
    const fleet = await this.updateFleetUseCase.execute(
      id,
      updateFleetDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(fleet),
      message: 'Fleet updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('FLEET_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteFleetUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(fleet: any): FleetResponseDto {
    return {
      id: fleet.fleetId,
      vehicleNum: fleet.vehicleNum,
      companyId: fleet.companyId,
      capacity: fleet.capacity || undefined,
      vehMake: fleet.vehMake || undefined,
      vehModel: fleet.vehModel || undefined,
      mfgYear: fleet.mfgYear || undefined,
      nextFCDate: fleet.nextFCDate || undefined,
      pucDateValidUpto: fleet.pucDateValidUpto || undefined,
      insuranceValidUpto: fleet.insuranceValidUpto || undefined,
      ownerName: fleet.ownerName || undefined,
      ownerContact: fleet.ownerContact || undefined,
      ownerEmail: fleet.ownerEmail || undefined,
      ownerPAN: fleet.ownerPAN || undefined,
      ownerAadhaar: fleet.ownerAadhaar || undefined,
      pymtToName: fleet.pymtToName || undefined,
      pymtBankName: fleet.pymtBankName || undefined,
      pymtAccNum: fleet.pymtAccNum || undefined,
      pymtIFSCode: fleet.pymtIFSCode || undefined,
      pymtBranch: fleet.pymtBranch || undefined,
      contractAmount: fleet.contractAmount || undefined,
      tdsExemption: fleet.tdsExemption || undefined,
      status: fleet.status,
      createdBy: fleet.createdBy,
      createdOn: fleet.createdOn.toISOString(),
      modifiedBy: fleet.modifiedBy,
      modifiedOn: fleet.modifiedOn.toISOString(),
    };
  }
}
