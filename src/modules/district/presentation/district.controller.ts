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
import { CreateDistrictUseCase } from '../application/use-cases/create-district.use-case';
import { GetDistrictUseCase } from '../application/use-cases/get-district.use-case';
import { GetAllDistrictsUseCase } from '../application/use-cases/get-all-districts.use-case';
import { UpdateDistrictUseCase } from '../application/use-cases/update-district.use-case';
import { DeleteDistrictUseCase } from '../application/use-cases/delete-district.use-case';
import { CreateDistrictDto } from '../application/dto/create-district.dto';
import { UpdateDistrictDto } from '../application/dto/update-district.dto';
import { DistrictResponseDto } from '../application/dto/district-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('districts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class DistrictController {
  constructor(
    private readonly createDistrictUseCase: CreateDistrictUseCase,
    private readonly getDistrictUseCase: GetDistrictUseCase,
    private readonly getAllDistrictsUseCase: GetAllDistrictsUseCase,
    private readonly updateDistrictUseCase: UpdateDistrictUseCase,
    private readonly deleteDistrictUseCase: DeleteDistrictUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('DISTRICT_CREATE')
  async create(@Body() createDistrictDto: CreateDistrictDto, @Request() req: any) {
    const district = await this.createDistrictUseCase.execute(
      createDistrictDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(district),
      message: 'District created successfully',
    };
  }

  @Get()
  @RequirePermissions('DISTRICT_VIEW')
  async findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('stateId') stateId?: string,
  ) {
    const districts = await this.getAllDistrictsUseCase.execute(
      activeOnly === 'true',
      stateId,
    );
    return {
      success: true,
      data: districts.map((d) => this.toResponseDto(d)),
      message: 'Districts retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('DISTRICT_VIEW')
  async findOne(@Param('id') id: string) {
    const district = await this.getDistrictUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(district),
      message: 'District retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('DISTRICT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDistrictDto: UpdateDistrictDto,
    @Request() req: any,
  ) {
    const district = await this.updateDistrictUseCase.execute(
      id,
      updateDistrictDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(district),
      message: 'District updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('DISTRICT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteDistrictUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(district: any): DistrictResponseDto {
    return {
      id: district.districtId,
      districtCode: district.districtCode,
      districtName: district.districtName,
      stateId: district.stateId,
      status: district.status,
      createdBy: district.createdBy,
      createdOn: district.createdOn.toISOString(),
      modifiedBy: district.modifiedBy,
      modifiedOn: district.modifiedOn.toISOString(),
    };
  }
}
