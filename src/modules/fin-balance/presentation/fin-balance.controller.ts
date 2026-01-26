import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateFinBalanceUseCase } from '../application/use-cases/create-fin-balance.use-case';
import { UpdateFinBalanceUseCase } from '../application/use-cases/update-fin-balance.use-case';
import { BulkUploadFinBalanceUseCase } from '../application/use-cases/bulk-upload-fin-balance.use-case';
import { ExcelParserService } from '../application/services/excel-parser.service';
import { CreateFinBalanceDto } from '../application/dto/create-fin-balance.dto';
import { UpdateFinBalanceDto } from '../application/dto/update-fin-balance.dto';
import { FinBalanceResponseDto } from '../application/dto/fin-balance-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { IFinBalanceRepository, FIN_BALANCE_REPOSITORY_TOKEN } from '../domain/interfaces/fin-balance.repository.interface';
import { Inject } from '@nestjs/common';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../company/domain/interfaces/company.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../hcf/domain/interfaces/hcf.repository.interface';

@Controller('fin-balance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class FinBalanceController {
  constructor(
    @Inject(FIN_BALANCE_REPOSITORY_TOKEN)
    private readonly finBalanceRepository: IFinBalanceRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly createFinBalanceUseCase: CreateFinBalanceUseCase,
    private readonly updateFinBalanceUseCase: UpdateFinBalanceUseCase,
    private readonly bulkUploadFinBalanceUseCase: BulkUploadFinBalanceUseCase,
    private readonly excelParserService: ExcelParserService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async create(@Body() createDto: CreateFinBalanceDto, @Request() req: any) {
    const finBalance = await this.createFinBalanceUseCase.execute(
      createDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: await this.toResponseDto(finBalance),
    };
  }

  @Put(':id')
  @RequirePermissions('INVOICE_CREATE')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFinBalanceDto,
    @Request() req: any,
  ) {
    const finBalance = await this.updateFinBalanceUseCase.execute(
      id,
      updateDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: await this.toResponseDto(finBalance),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('INVOICE_CREATE')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.finBalanceRepository.delete(id, req.user?.userId);
    return { success: true };
  }

  @Get()
  @RequirePermissions('INVOICE_VIEW')
  async findAll(@Query('companyId') companyId?: string) {
    const balances = companyId
      ? await this.finBalanceRepository.findByCompany(companyId)
      : await this.finBalanceRepository.findAll();

    const response = await Promise.all(
      balances.map(b => this.toResponseDto(b))
    );

    return {
      success: true,
      data: response,
    };
  }

  @Get(':id')
  @RequirePermissions('INVOICE_VIEW')
  async findOne(@Param('id') id: string) {
    const finBalance = await this.finBalanceRepository.findById(id);
    if (!finBalance) {
      throw new Error('Financial balance not found');
    }
    return {
      success: true,
      data: await this.toResponseDto(finBalance),
    };
  }

  /**
   * Preview Excel upload - returns inserts and updates without saving
   */
  @Post('bulk-upload/preview')
  @RequirePermissions('INVOICE_CREATE')
  @UseInterceptors(FileInterceptor('file'))
  async previewBulkUpload(
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string } | undefined,
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('Excel file is required');
    }

    // Parse Excel
    const rows = this.excelParserService.parseFinBalanceExcel(file.buffer);

    // Get company and HCF code mappings
    const companies = await this.companyRepository.findAll();
    const hcfs = await this.hcfRepository.findAll();

    const companyCodeMap = new Map<string, string>();
    companies.forEach(c => {
      companyCodeMap.set(c.companyCode, c.companyId);
    });

    const hcfCodeMap = new Map<string, string>();
    hcfs.forEach(h => {
      hcfCodeMap.set(h.hcfCode, h.hcfId);
    });

    // Map Excel rows to DTOs
    const { valid, errors } = await this.excelParserService.mapExcelRowsToDto(
      rows,
      companyCodeMap,
      hcfCodeMap,
    );

    // Preview (identify inserts vs updates)
    const preview = await this.bulkUploadFinBalanceUseCase.preview(valid);

    return {
      success: true,
      data: {
        ...preview,
        parseErrors: errors,
      },
    };
  }

  /**
   * Execute bulk upload - saves inserts and updates
   */
  @Post('bulk-upload/execute')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async executeBulkUpload(
    @Body() body: { preview: any },
    @Request() req: any,
  ) {
    const result = await this.bulkUploadFinBalanceUseCase.execute(
      body.preview,
      req.user?.userId,
    );

    const created = await Promise.all(
      result.created.map(b => this.toResponseDto(b))
    );
    const updated = await Promise.all(
      result.updated.map(b => this.toResponseDto(b))
    );

    return {
      success: true,
      data: {
        created,
        updated,
      },
    };
  }

  private async toResponseDto(finBalance: any): Promise<FinBalanceResponseDto> {
    const company = await this.companyRepository.findById(finBalance.companyId);
    const hcf = await this.hcfRepository.findById(finBalance.hcfId);

    return {
      finBalanceId: finBalance.finBalanceId,
      companyId: finBalance.companyId,
      companyName: company?.companyName,
      companyCode: company?.companyCode,
      hcfId: finBalance.hcfId,
      hcfCode: hcf?.hcfCode,
      hcfName: hcf?.hcfName,
      openingBalance: finBalance.openingBalance,
      currentBalance: finBalance.currentBalance,
      isManual: finBalance.isManual,
      notes: finBalance.notes,
      createdBy: finBalance.createdBy,
      createdOn: finBalance.createdOn.toISOString(),
      modifiedBy: finBalance.modifiedBy,
      modifiedOn: finBalance.modifiedOn.toISOString(),
    };
  }
}
