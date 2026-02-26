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
  ) {}

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
      data: this.entityToResponseDto(entity),
      message: 'Company created successfully',
    };
  }

  @Get()
  @RequirePermissions('COMPANY_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const entities = await this.companyRepository.getAllEntities(activeOnly === 'true');
    return {
      success: true,
      data: entities.map((e) => this.entityToResponseDto(e)),
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
      data: this.entityToResponseDto(entity),
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
      data: this.entityToResponseDto(entity),
      message: 'Company updated successfully',
    };
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
    return {
      id: entity.companyId,
      companyCode: entity.companyCode,
      companyName: entity.companyName,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn.toISOString(),
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn.toISOString(),
      contactNum: entity.contactNum,
      webAddress: entity.webAddress,
      companyEmail: entity.companyEmail,
      bankAccountName: entity.bankAccountName,
      bankName: entity.bankName,
      bankAccountNum: entity.bankAccountNum,
      bankIFSCode: entity.bankIFSCode,
      bankBranch: entity.bankBranch,
      upiId: entity.upiId,
      qrCode: entity.qrCode,
    };
  }
}
