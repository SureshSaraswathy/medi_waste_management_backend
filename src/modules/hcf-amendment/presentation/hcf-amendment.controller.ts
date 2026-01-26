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
import { CreateHcfAmendmentUseCase } from '../application/use-cases/create-hcf-amendment.use-case';
import { GetHcfAmendmentUseCase } from '../application/use-cases/get-hcf-amendment.use-case';
import { GetAllHcfAmendmentsUseCase } from '../application/use-cases/get-all-hcf-amendments.use-case';
import { UpdateHcfAmendmentUseCase } from '../application/use-cases/update-hcf-amendment.use-case';
import { DeleteHcfAmendmentUseCase } from '../application/use-cases/delete-hcf-amendment.use-case';
import { CreateHcfAmendmentDto } from '../application/dto/create-hcf-amendment.dto';
import { UpdateHcfAmendmentDto } from '../application/dto/update-hcf-amendment.dto';
import { HcfAmendmentResponseDto } from '../application/dto/hcf-amendment-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('hcf-amendments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class HcfAmendmentController {
  constructor(
    private readonly createHcfAmendmentUseCase: CreateHcfAmendmentUseCase,
    private readonly getHcfAmendmentUseCase: GetHcfAmendmentUseCase,
    private readonly getAllHcfAmendmentsUseCase: GetAllHcfAmendmentsUseCase,
    private readonly updateHcfAmendmentUseCase: UpdateHcfAmendmentUseCase,
    private readonly deleteHcfAmendmentUseCase: DeleteHcfAmendmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('HCF_AMENDMENT_CREATE')
  async create(@Body() createHcfAmendmentDto: CreateHcfAmendmentDto, @Request() req: any) {
    const hcfAmendment = await this.createHcfAmendmentUseCase.execute(
      createHcfAmendmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcfAmendment),
      message: 'HCF Amendment created successfully',
    };
  }

  @Get()
  @RequirePermissions('HCF_AMENDMENT_VIEW')
  async findAll(@Query('hcfId') hcfId?: string, @Query('activeOnly') activeOnly?: string) {
    const hcfAmendments = await this.getAllHcfAmendmentsUseCase.execute(hcfId, activeOnly === 'true');
    return {
      success: true,
      data: hcfAmendments.map((h) => this.toResponseDto(h)),
      message: 'HCF Amendments retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('HCF_AMENDMENT_VIEW')
  async findOne(@Param('id') id: string) {
    const hcfAmendment = await this.getHcfAmendmentUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(hcfAmendment),
      message: 'HCF Amendment retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('HCF_AMENDMENT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateHcfAmendmentDto: UpdateHcfAmendmentDto,
    @Request() req: any,
  ) {
    const hcfAmendment = await this.updateHcfAmendmentUseCase.execute(
      id,
      updateHcfAmendmentDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcfAmendment),
      message: 'HCF Amendment updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('HCF_AMENDMENT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteHcfAmendmentUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(hcfAmendment: any): HcfAmendmentResponseDto {
    return {
      id: hcfAmendment.hcfAmendmentId,
      hcfId: hcfAmendment.hcfId,
      amendmentType: hcfAmendment.amendmentType,
      amendmentDate: hcfAmendment.amendmentDate,
      description: hcfAmendment.description || undefined,
      status: hcfAmendment.amendmentStatus || undefined,
      approvedBy: hcfAmendment.approvedBy || undefined,
      approvedDate: hcfAmendment.approvedDate || undefined,
      createdBy: hcfAmendment.createdBy,
      createdOn: hcfAmendment.createdOn.toISOString(),
      modifiedBy: hcfAmendment.modifiedBy,
      modifiedOn: hcfAmendment.modifiedOn.toISOString(),
    };
  }
}
