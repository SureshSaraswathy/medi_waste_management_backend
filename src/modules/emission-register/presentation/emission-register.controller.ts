import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmissionRegisterService } from '../emission-register.service';
import { CreateEmissionRegisterDto } from '../application/dto/create-emission-register.dto';
import { UpdateEmissionRegisterDto } from '../application/dto/update-emission-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('emission-registers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmissionRegisterController {
  constructor(private readonly emissionRegisterService: EmissionRegisterService) {}

  @Post()
  @RequirePermissions('EMISSION_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEmissionRegisterDto, @Request() req: any) {
    const userId = req.user?.userId;
    const emission = await this.emissionRegisterService.create(createDto, userId);
    return {
      success: true,
      data: this.toResponseDto(emission),
      message: 'Emission register created successfully',
    };
  }

  @Get()
  @RequirePermissions('EMISSION_REGISTER_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    const emissions = await this.emissionRegisterService.findAll(companyId, status);
    return {
      success: true,
      data: emissions.map((e) => this.toResponseDto(e)),
      message: 'Emission registers retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('EMISSION_REGISTER_VIEW')
  async findOne(@Param('id') id: string) {
    const emission = await this.emissionRegisterService.findOne(id);
    return {
      success: true,
      data: this.toResponseDto(emission),
      message: 'Emission register retrieved successfully',
    };
  }

  @Patch(':id')
  @RequirePermissions('EMISSION_REGISTER_EDIT')
  async update(@Param('id') id: string, @Body() updateDto: UpdateEmissionRegisterDto, @Request() req: any) {
    const userId = req.user?.userId;
    const emission = await this.emissionRegisterService.update(id, updateDto, userId);
    return {
      success: true,
      data: this.toResponseDto(emission),
      message: 'Emission register updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermissions('EMISSION_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.emissionRegisterService.remove(id);
  }

  private toResponseDto(emission: any) {
    return {
      id: emission.emissionId,
      emisRegNum: emission.emisRegNum,
      companyId: emission.companyId,
      emissionDate: emission.emissionDate instanceof Date ? emission.emissionDate.toISOString() : emission.emissionDate,
      equipmentId: emission.equipmentId,
      stackId: emission.stackId,
      pm: emission.pm,
      co: emission.co,
      hci: emission.hci,
      temp: emission.temp,
      oxygen: emission.oxygen,
      complianceStatus: emission.complianceStatus,
      status: emission.status,
      createdBy: emission.createdBy,
      createdOn: emission.createdOn instanceof Date ? emission.createdOn.toISOString() : emission.createdOn,
      modifiedBy: emission.modifiedBy,
      modifiedOn: emission.modifiedOn instanceof Date ? emission.modifiedOn.toISOString() : emission.modifiedOn,
    };
  }
}
