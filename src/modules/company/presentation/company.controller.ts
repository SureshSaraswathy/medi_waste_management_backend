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
  ParseUUIDPipe,
  UploadedFile,
  Res,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CompanyLogoService } from '../application/services/company-logo.service';
import { MAX_LOGO_BYTES } from '../../../common/storage/image-validator.util';
import { CreateCompanyUseCase } from '../application/use-cases/create-company.use-case';
import { GetCompanyUseCase } from '../application/use-cases/get-company.use-case';
import { GetAllCompaniesUseCase } from '../application/use-cases/get-all-companies.use-case';
import { UpdateCompanyUseCase } from '../application/use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from '../application/use-cases/delete-company.use-case';
import { CreateCompanyDto } from '../application/dto/create-company.dto';
import { UpdateCompanyDto } from '../application/dto/update-company.dto';
import { CompanyResponseDto } from '../application/dto/company-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { Inject } from '@nestjs/common';
import { COMPANY_REPOSITORY_TOKEN, ICompanyRepository } from '../domain/interfaces/company.repository.interface';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly getAllCompaniesUseCase: GetAllCompaniesUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly deleteCompanyUseCase: DeleteCompanyUseCase,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    private readonly companyLogoService: CompanyLogoService,
  ) {}

  /** Adds logoUrl / logoUpdatedAt (read via raw SQL, so it is safe before the migration is applied). */
  private withLogo(dto: CompanyResponseDto, info?: { logoPath: string; logoUpdatedAt: Date | null } | null) {
    dto.logoUrl = this.companyLogoService.buildUrl(dto.id, info as any);
    dto.logoUpdatedAt = info?.logoUpdatedAt ? new Date(info.logoUpdatedAt).toISOString() : null;
    return dto;
  }

  /**
   * A customer user may only change or read the logo of ITS OWN company (company id from the verified JWT);
   * platform administrators (wildcard permission, superadmin role or the SuperAdmin id) may address any company.
   */
  private assertOwnCompany(user: any, companyId: string): void {
    const platformAdmin =
      (Array.isArray(user?.permissions) && user.permissions.includes('*')) ||
      (Array.isArray(user?.roles) && (user.roles.includes('superadmin') || user.roles.includes('SUPER_ADMIN'))) ||
      user?.userId === '00000000-0000-0000-0000-000000000001';
    if (!platformAdmin && (!user?.companyId || user.companyId !== companyId)) {
      throw new ForbiddenException('You can only manage the logo of your own company');
    }
  }

  private async dtoWithLogo(entity: any): Promise<CompanyResponseDto> {
    const info = await this.companyRepository.getLogoInfo(entity.companyId);
    return this.withLogo(this.entityToResponseDto(entity), info);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('COMPANY_CREATE')
  async create(@Body() createCompanyDto: CreateCompanyDto, @Request() req: any) {
    const company = await this.createCompanyUseCase.execute(
      createCompanyDto,
      req.user?.userId,
    );
    const entity = await this.companyRepository.getEntityById(company.companyId);
    if (!entity) {
      throw new Error('Company not found after creation');
    }
    return {
      success: true,
      data: await this.dtoWithLogo(entity),
      message: 'Company created successfully',
    };
  }

  @Get()
  @RequirePermissions('COMPANY_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const entities = await this.companyRepository.getAllEntities(activeOnly === 'true');
    const logos = await this.companyRepository.getLogoInfoMap();
    return {
      success: true,
      data: entities.map((e) => this.withLogo(this.entityToResponseDto(e), logos.get(e.companyId))),
      message: 'Companies retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('COMPANY_VIEW')
  async findOne(@Param('id') id: string) {
    const entity = await this.companyRepository.getEntityById(id);
    if (!entity) {
      throw new Error('Company not found');
    }
    return {
      success: true,
      data: await this.dtoWithLogo(entity),
      message: 'Company retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('COMPANY_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: any,
  ) {
    await this.updateCompanyUseCase.execute(
      id,
      updateCompanyDto,
      req.user?.userId,
    );
    const entity = await this.companyRepository.getEntityById(id);
    if (!entity) {
      throw new Error('Company not found');
    }
    return {
      success: true,
      data: await this.dtoWithLogo(entity),
      message: 'Company updated successfully',
    };
  }

  // ---- Company Logo ----------------------------------------------------------------------

  @Post(':id/logo')
  @RequirePermissions('COMPANY_EDIT')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_LOGO_BYTES, files: 1 } }))
  async uploadLogo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    this.assertOwnCompany(req.user, id);
    if (!file) throw new BadRequestException('No file uploaded. Send the image in the "file" field.');
    const info = await this.companyLogoService.upload(id, file);
    return {
      success: true,
      data: {
        logoUrl: this.companyLogoService.buildUrl(id, info),
        logoUpdatedAt: info?.logoUpdatedAt ? new Date(info.logoUpdatedAt).toISOString() : null,
      },
      message: 'Company logo saved successfully',
    };
  }

  @Delete(':id/logo')
  @RequirePermissions('COMPANY_EDIT')
  async removeLogo(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) {
    this.assertOwnCompany(req.user, id);
    await this.companyLogoService.remove(id);
    return { success: true, data: { logoUrl: null, logoUpdatedAt: null }, message: 'Company logo removed' };
  }

  @Get(':id/logo')
  @RequirePermissions('COMPANY_VIEW')
  async getLogo(@Param('id', new ParseUUIDPipe()) id: string, @Res() res: Response, @Request() req: any) {
    this.assertOwnCompany(req.user, id);
    const file = await this.companyLogoService.getFile(id);
    if (!file) throw new NotFoundException('Company logo not configured');
    res.set({
      'Content-Type': file.mime,
      'Content-Length': String(file.buffer.length),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.end(file.buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('COMPANY_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteCompanyUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(company: any): CompanyResponseDto {
    return {
      id: company.companyId,
      companyCode: company.companyCode,
      companyName: company.companyName,
      status: company.status,
      createdBy: company.createdBy,
      createdOn: company.createdOn.toISOString(),
      modifiedBy: company.modifiedBy,
      modifiedOn: company.modifiedOn.toISOString(),
    };
  }

  private entityToResponseDto(entity: any): CompanyResponseDto {
    // Helper function to safely convert date to ISO string
    const safeDateToString = (date: any): string | null => {
      if (!date) return null;
      try {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        if (typeof date === 'string') {
          return date;
        }
        return null;
      } catch {
        return null;
      }
    };

    return {
      id: entity.companyId,
      companyCode: entity.companyCode,
      companyName: entity.companyName,
      gstin: entity?.gstin ?? null,
      pincode: entity?.pincode ?? null,
      state: entity?.state ?? null,
      prefix: entity?.prefix ?? null,
      // Address Information - safely access properties that might not exist in DB yet
      regdOfficeAddress: entity?.regdOfficeAddress ?? null,
      adminOfficeAddress: entity?.adminOfficeAddress ?? null,
      factoryAddress: entity?.factoryAddress ?? null,
      // Authorized Person Information
      authPersonName: entity?.authPersonName ?? null,
      authPersonDesignation: entity?.authPersonDesignation ?? null,
      authPersonDOB: safeDateToString(entity?.authPersonDOB),
      // PCB & Compliance
      pcbauthNum: entity?.pcbauthNum ?? null,
      hazardousWasteNum: entity?.hazardousWasteNum ?? null,
      // CTO (Consent To Operate) - Water
      ctoWaterNum: entity?.ctoWaterNum ?? null,
      ctoWaterDate: safeDateToString(entity?.ctoWaterDate),
      ctoWaterValidUpto: safeDateToString(entity?.ctoWaterValidUpto),
      // CTO (Consent To Operate) - Air
      ctoAirNum: entity?.ctoAirNum ?? null,
      ctoAirDate: safeDateToString(entity?.ctoAirDate),
      ctoAirValidUpto: safeDateToString(entity?.ctoAirValidUpto),
      // CTE (Consent To Establish) - Water
      cteWaterNum: entity?.cteWaterNum ?? null,
      cteWaterDate: safeDateToString(entity?.cteWaterDate),
      cteWaterValidUpto: safeDateToString(entity?.cteWaterValidUpto),
      // CTE (Consent To Establish) - Air
      cteAirNum: entity?.cteAirNum ?? null,
      cteAirDate: safeDateToString(entity?.cteAirDate),
      cteAirValidUpto: safeDateToString(entity?.cteAirValidUpto),
      // GST Details
      pcbZoneID: entity?.pcbZoneID ?? null,
      gstValidFrom: safeDateToString(entity?.gstValidFrom),
      gstRate: entity?.gstRate ?? null,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn?.toISOString() ?? new Date().toISOString(),
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn?.toISOString() ?? new Date().toISOString(),
      // Contact Information
      contactNum: entity?.contactNum ?? null,
      webAddress: entity?.webAddress ?? null,
      companyEmail: entity?.companyEmail ?? null,
      // Bank & Payment Information
      bankAccountName: entity?.bankAccountName ?? null,
      bankName: entity?.bankName ?? null,
      bankAccountNum: entity?.bankAccountNum ?? null,
      bankIFSCode: entity?.bankIFSCode ?? null,
      bankBranch: entity?.bankBranch ?? null,
      upiId: entity?.upiId ?? null,
      qrCode: entity?.qrCode ?? null,
    };
  }
}
