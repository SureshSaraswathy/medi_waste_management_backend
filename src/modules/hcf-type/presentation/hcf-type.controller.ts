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
import { CreateHcfTypeUseCase } from '../application/use-cases/create-hcf-type.use-case';
import { GetHcfTypeUseCase } from '../application/use-cases/get-hcf-type.use-case';
import { GetAllHcfTypesUseCase } from '../application/use-cases/get-all-hcf-types.use-case';
import { UpdateHcfTypeUseCase } from '../application/use-cases/update-hcf-type.use-case';
import { DeleteHcfTypeUseCase } from '../application/use-cases/delete-hcf-type.use-case';
import { CreateHcfTypeDto } from '../application/dto/create-hcf-type.dto';
import { UpdateHcfTypeDto } from '../application/dto/update-hcf-type.dto';
import { HcfTypeResponseDto } from '../application/dto/hcf-type-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('hcf-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class HcfTypeController {
  constructor(
    private readonly createHcfTypeUseCase: CreateHcfTypeUseCase,
    private readonly getHcfTypeUseCase: GetHcfTypeUseCase,
    private readonly getAllHcfTypesUseCase: GetAllHcfTypesUseCase,
    private readonly updateHcfTypeUseCase: UpdateHcfTypeUseCase,
    private readonly deleteHcfTypeUseCase: DeleteHcfTypeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('HCF_TYPE_CREATE')
  async create(@Body() createHcfTypeDto: CreateHcfTypeDto, @Request() req: any) {
    const hcfType = await this.createHcfTypeUseCase.execute(
      createHcfTypeDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcfType),
      message: 'HCF Type created successfully',
    };
  }

  @Get()
  @RequirePermissions('HCF_TYPE_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const hcfTypes = await this.getAllHcfTypesUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: hcfTypes.map((h) => this.toResponseDto(h)),
      message: 'HCF Types retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('HCF_TYPE_VIEW')
  async findOne(@Param('id') id: string) {
    const hcfType = await this.getHcfTypeUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(hcfType),
      message: 'HCF Type retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('HCF_TYPE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateHcfTypeDto: UpdateHcfTypeDto,
    @Request() req: any,
  ) {
    const hcfType = await this.updateHcfTypeUseCase.execute(
      id,
      updateHcfTypeDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcfType),
      message: 'HCF Type updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('HCF_TYPE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteHcfTypeUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(hcfType: any): HcfTypeResponseDto {
    return {
      id: hcfType.hcfTypeId,
      hcfTypeCode: hcfType.hcfTypeCode,
      hcfTypeName: hcfType.hcfTypeName,
      companyId: hcfType.companyId,
      status: hcfType.status,
      createdBy: hcfType.createdBy,
      createdOn: hcfType.createdOn.toISOString(),
      modifiedBy: hcfType.modifiedBy,
      modifiedOn: hcfType.modifiedOn.toISOString(),
    };
  }
}
