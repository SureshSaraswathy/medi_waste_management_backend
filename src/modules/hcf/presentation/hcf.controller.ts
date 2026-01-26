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
import { CreateHcfUseCase } from '../application/use-cases/create-hcf.use-case';
import { GetHcfUseCase } from '../application/use-cases/get-hcf.use-case';
import { GetAllHcfsUseCase } from '../application/use-cases/get-all-hcfs.use-case';
import { UpdateHcfUseCase } from '../application/use-cases/update-hcf.use-case';
import { DeleteHcfUseCase } from '../application/use-cases/delete-hcf.use-case';
import { CreateHcfDto } from '../application/dto/create-hcf.dto';
import { UpdateHcfDto } from '../application/dto/update-hcf.dto';
import { HcfResponseDto } from '../application/dto/hcf-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('hcfs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class HcfController {
  constructor(
    private readonly createHcfUseCase: CreateHcfUseCase,
    private readonly getHcfUseCase: GetHcfUseCase,
    private readonly getAllHcfsUseCase: GetAllHcfsUseCase,
    private readonly updateHcfUseCase: UpdateHcfUseCase,
    private readonly deleteHcfUseCase: DeleteHcfUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('HCF_CREATE')
  async create(@Body() createHcfDto: CreateHcfDto, @Request() req: any) {
    const hcf = await this.createHcfUseCase.execute(
      createHcfDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcf),
      message: 'HCF created successfully',
    };
  }

  @Get()
  @RequirePermissions('HCF_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const hcfs = await this.getAllHcfsUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: hcfs.map((h) => this.toResponseDto(h)),
      message: 'HCFs retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('HCF_VIEW')
  async findOne(@Param('id') id: string) {
    const hcf = await this.getHcfUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(hcf),
      message: 'HCF retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('HCF_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateHcfDto: UpdateHcfDto,
    @Request() req: any,
  ) {
    const hcf = await this.updateHcfUseCase.execute(
      id,
      updateHcfDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(hcf),
      message: 'HCF updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('HCF_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteHcfUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(hcf: any): HcfResponseDto {
    return {
      id: hcf.hcfId,
      hcfCode: hcf.hcfCode,
      companyId: hcf.companyId,
      password: hcf.password || undefined,
      hcfTypeCode: hcf.hcfTypeCode || undefined,
      hcfName: hcf.hcfName,
      hcfShortName: hcf.hcfShortName || undefined,
      areaId: hcf.areaId || undefined,
      pincode: hcf.pincode || undefined,
      district: hcf.district || undefined,
      stateCode: hcf.stateCode || undefined,
      groupCode: hcf.groupCode || undefined,
      pcbZone: hcf.pcbZone || undefined,
      billingName: hcf.billingName || undefined,
      billingAddress: hcf.billingAddress || undefined,
      serviceAddress: hcf.serviceAddress || undefined,
      gstin: hcf.gstin || undefined,
      regnNum: hcf.regnNum || undefined,
      hospRegnDate: hcf.hospRegnDate || undefined,
      billingType: hcf.billingType || undefined,
      advAmount: hcf.advAmount || undefined,
      billingOption: hcf.billingOption || undefined,
      bedCount: hcf.bedCount || undefined,
      bedRate: hcf.bedRate || undefined,
      kgRate: hcf.kgRate || undefined,
      lumpsum: hcf.lumpsum || undefined,
      accountsLandline: hcf.accountsLandline || undefined,
      accountsMobile: hcf.accountsMobile || undefined,
      accountsEmail: hcf.accountsEmail || undefined,
      contactName: hcf.contactName || undefined,
      contactDesignation: hcf.contactDesignation || undefined,
      contactMobile: hcf.contactMobile || undefined,
      contactEmail: hcf.contactEmail || undefined,
      agrSignAuthName: hcf.agrSignAuthName || undefined,
      agrSignAuthDesignation: hcf.agrSignAuthDesignation || undefined,
      drName: hcf.drName || undefined,
      drPhNo: hcf.drPhNo || undefined,
      drEmail: hcf.drEmail || undefined,
      serviceStartDate: hcf.serviceStartDate || undefined,
      serviceEndDate: hcf.serviceEndDate || undefined,
      category: hcf.category || undefined,
      route: hcf.route || undefined,
      executive_Assigned: hcf.executiveAssigned || undefined,
      submitBy: hcf.submitBy || undefined,
      agrID: hcf.agrID || undefined,
      sortOrder: hcf.sortOrder || undefined,
      isGovt: hcf.isGovt || undefined,
      isGSTExempt: hcf.isGSTExempt || undefined,
      autoGen: hcf.autoGen || undefined,
      status: hcf.status,
      createdBy: hcf.createdBy,
      createdOn: hcf.createdOn.toISOString(),
      modifiedBy: hcf.modifiedBy,
      modifiedOn: hcf.modifiedOn.toISOString(),
    };
  }
}
