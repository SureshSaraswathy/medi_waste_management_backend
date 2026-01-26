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
import { CreateInvoiceUseCase } from '../application/use-cases/create-invoice.use-case';
import { GenerateInvoiceAutoUseCase } from '../application/use-cases/generate-invoice-auto.use-case';
import { GenerateInvoiceWeightUseCase } from '../application/use-cases/generate-invoice-weight.use-case';
import { GenerateInvoiceMonthUseCase } from '../application/use-cases/generate-invoice-month.use-case';
import { GetInvoiceUseCase } from '../application/use-cases/get-invoice.use-case';
import { GetAllInvoicesUseCase } from '../application/use-cases/get-all-invoices.use-case';
import { UpdateInvoiceUseCase } from '../application/use-cases/update-invoice.use-case';
import { DeleteInvoiceUseCase } from '../application/use-cases/delete-invoice.use-case';
import { CreateInvoiceDto } from '../application/dto/create-invoice.dto';
import { GenerateInvoiceDto } from '../application/dto/generate-invoice.dto';
import { GenerateInvoiceWeightDto } from '../application/dto/generate-invoice-weight.dto';
import { GenerateInvoiceMonthDto } from '../application/dto/generate-invoice-month.dto';
import { UpdateInvoiceDto } from '../application/dto/update-invoice.dto';
import { InvoiceResponseDto } from '../application/dto/invoice-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { Invoice } from '../domain/entities/invoice.domain.entity';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class InvoiceController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly generateInvoiceAutoUseCase: GenerateInvoiceAutoUseCase,
    private readonly generateInvoiceWeightUseCase: GenerateInvoiceWeightUseCase,
    private readonly generateInvoiceMonthUseCase: GenerateInvoiceMonthUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly getAllInvoicesUseCase: GetAllInvoicesUseCase,
    private readonly updateInvoiceUseCase: UpdateInvoiceUseCase,
    private readonly deleteInvoiceUseCase: DeleteInvoiceUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    const invoice = await this.createInvoiceUseCase.execute(
      createInvoiceDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(invoice),
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async generate(@Body() generateInvoiceDto: GenerateInvoiceDto, @Request() req: any) {
    const result = await this.generateInvoiceAutoUseCase.execute(
      generateInvoiceDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: {
        generated: result.success.map(inv => this.toResponseDto(inv)),
        failed: result.failed,
        summary: {
          total: result.success.length + result.failed.length,
          success: result.success.length,
          failed: result.failed.length,
        },
      },
    };
  }

  @Post('generate-weight')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async generateWeight(@Body() generateInvoiceWeightDto: GenerateInvoiceWeightDto, @Request() req: any) {
    const result = await this.generateInvoiceWeightUseCase.execute(
      generateInvoiceWeightDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: {
        generated: result.success.map(inv => this.toResponseDto(inv)),
        failed: result.failed,
        summary: {
          total: result.success.length + result.failed.length,
          success: result.success.length,
          failed: result.failed.length,
        },
      },
    };
  }

  @Post('generate-month')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async generateMonth(@Body() generateInvoiceMonthDto: GenerateInvoiceMonthDto, @Request() req: any) {
    const result = await this.generateInvoiceMonthUseCase.execute(
      generateInvoiceMonthDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: {
        generated: result.success.map(inv => this.toResponseDto(inv)),
        failed: result.failed,
        skipped: result.skipped,
        summary: {
          total: result.success.length + result.failed.length + result.skipped.length,
          success: result.success.length,
          failed: result.failed.length,
          skipped: result.skipped.length,
        },
      },
    };
  }

  @Get()
  @RequirePermissions('INVOICE_VIEW')
  async findAll(@Query() query: any) {
    const invoices = await this.getAllInvoicesUseCase.execute({
      companyId: query.companyId,
      hcfId: query.hcfId,
      status: query.status,
      financialYear: query.financialYear,
      invoiceDateFrom: query.invoiceDateFrom,
      invoiceDateTo: query.invoiceDateTo,
    });
    return {
      success: true,
      data: invoices.map(inv => this.toResponseDto(inv)),
    };
  }

  @Get(':id')
  @RequirePermissions('INVOICE_VIEW')
  async findOne(@Param('id') id: string) {
    const invoice = await this.getInvoiceUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(invoice),
    };
  }

  @Put(':id')
  @RequirePermissions('INVOICE_UPDATE')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: any,
  ) {
    const invoice = await this.updateInvoiceUseCase.execute(
      id,
      updateInvoiceDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(invoice),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('INVOICE_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteInvoiceUseCase.execute(id);
    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }

  private toResponseDto(invoice: Invoice): InvoiceResponseDto {
    // Helper function to safely convert date to ISO string
    const toDateString = (date: Date | string | null | undefined): string | null => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
      }
      return null;
    };

    // Helper function to safely convert date to full ISO string
    const toISOString = (date: Date | string | null | undefined): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      }
      return new Date().toISOString();
    };

    return {
      invoiceId: invoice.invoiceId,
      companyId: invoice.companyId,
      hcfId: invoice.hcfId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: toDateString(invoice.invoiceDate) || '',
      dueDate: toDateString(invoice.dueDate) || '',
      billingType: invoice.billingType,
      billingDays: invoice.billingDays,
      billingOption: invoice.billingOption,
      generationType: invoice.generationType,
      bedCount: invoice.bedCount,
      bedRate: invoice.bedRate,
      weightInKg: invoice.weightInKg,
      kgRate: invoice.kgRate,
      lumpsumAmount: invoice.lumpsumAmount,
      taxableValue: invoice.taxableValue,
      igst: invoice.igst,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      roundOff: invoice.roundOff,
      invoiceValue: invoice.invoiceValue,
      totalPaidAmount: invoice.totalPaidAmount,
      balanceAmount: invoice.balanceAmount,
      status: invoice.status,
      isLocked: invoice.isLocked,
      lockedAfterDate: toDateString(invoice.lockedAfterDate),
      financialYear: invoice.financialYear,
      sequenceNumber: invoice.sequenceNumber,
      billingPeriodStart: toDateString(invoice.billingPeriodStart),
      billingPeriodEnd: toDateString(invoice.billingPeriodEnd),
      notes: invoice.notes,
      createdBy: invoice.createdBy,
      createdOn: toISOString(invoice.createdOn),
      modifiedBy: invoice.modifiedBy,
      modifiedOn: toISOString(invoice.modifiedOn),
    };
  }
}
