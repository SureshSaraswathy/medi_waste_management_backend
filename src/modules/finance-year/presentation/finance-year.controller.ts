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
import { CreateFinanceYearUseCase } from '../application/use-cases/create-finance-year.use-case';
import { GetFinanceYearUseCase } from '../application/use-cases/get-finance-year.use-case';
import { GetAllFinanceYearsUseCase } from '../application/use-cases/get-all-finance-years.use-case';
import { UpdateFinanceYearUseCase } from '../application/use-cases/update-finance-year.use-case';
import { DeleteFinanceYearUseCase } from '../application/use-cases/delete-finance-year.use-case';
import { CreateFinanceYearDto } from '../application/dto/create-finance-year.dto';
import { UpdateFinanceYearDto } from '../application/dto/update-finance-year.dto';
import { FinanceYearResponseDto } from '../application/dto/finance-year-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('finance-years')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class FinanceYearController {
  constructor(
    private readonly createFinanceYearUseCase: CreateFinanceYearUseCase,
    private readonly getFinanceYearUseCase: GetFinanceYearUseCase,
    private readonly getAllFinanceYearsUseCase: GetAllFinanceYearsUseCase,
    private readonly updateFinanceYearUseCase: UpdateFinanceYearUseCase,
    private readonly deleteFinanceYearUseCase: DeleteFinanceYearUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('FINANCE_YEAR_CREATE')
  async create(@Body() createFinanceYearDto: CreateFinanceYearDto, @Request() req: any) {
    try {
      const financeYear = await this.createFinanceYearUseCase.execute(
        createFinanceYearDto,
        req.user?.userId || req.user?.id,
      );
      return {
        success: true,
        data: this.toResponseDto(financeYear),
        message: 'Finance Year created successfully.',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @RequirePermissions('FINANCE_YEAR_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const financeYears = await this.getAllFinanceYearsUseCase.execute(
      activeOnly === 'true',
    );
    return {
      success: true,
      data: financeYears.map((fy) => this.toResponseDto(fy)),
      message: 'Finance Years retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('FINANCE_YEAR_VIEW')
  async findOne(@Param('id') id: string) {
    const financeYear = await this.getFinanceYearUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(financeYear),
      message: 'Finance Year retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('FINANCE_YEAR_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateFinanceYearDto: UpdateFinanceYearDto,
    @Request() req: any,
  ) {
    const financeYear = await this.updateFinanceYearUseCase.execute(
      id,
      updateFinanceYearDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(financeYear),
      message: 'Finance Year updated successfully.',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('FINANCE_YEAR_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteFinanceYearUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(financeYear: any): FinanceYearResponseDto {
    const formatDate = (date: Date | string): string => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().split('T')[0];
    };

    return {
      id: financeYear.financeYearId,
      finYear: financeYear.finYear,
      fyStartDate: formatDate(financeYear.fyStartDate),
      fyEndDate: formatDate(financeYear.fyEndDate),
      status: financeYear.status,
      createdBy: financeYear.createdBy,
      createdOn: financeYear.createdOn instanceof Date 
        ? financeYear.createdOn.toISOString() 
        : new Date(financeYear.createdOn).toISOString(),
      modifiedBy: financeYear.modifiedBy,
      modifiedOn: financeYear.modifiedOn instanceof Date 
        ? financeYear.modifiedOn.toISOString() 
        : new Date(financeYear.modifiedOn).toISOString(),
    };
  }
}
