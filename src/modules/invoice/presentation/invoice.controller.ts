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
  BadRequestException,
  UseGuards,
  UseInterceptors,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateInvoiceUseCase } from '../application/use-cases/create-invoice.use-case';
import { GenerateInvoiceAutoUseCase } from '../application/use-cases/generate-invoice-auto.use-case';
import { GenerateInvoiceWeightUseCase } from '../application/use-cases/generate-invoice-weight.use-case';
import { GenerateInvoiceMonthUseCase } from '../application/use-cases/generate-invoice-month.use-case';
import { GetInvoiceUseCase } from '../application/use-cases/get-invoice.use-case';
import { GetAllInvoicesUseCase } from '../application/use-cases/get-all-invoices.use-case';
import { UpdateInvoiceUseCase } from '../application/use-cases/update-invoice.use-case';
import { DeleteInvoiceUseCase } from '../application/use-cases/delete-invoice.use-case';
import { PostInvoiceUseCase } from '../application/use-cases/post-invoice.use-case';
import { CreateInvoiceDto } from '../application/dto/create-invoice.dto';
import { GenerateInvoiceDto } from '../application/dto/generate-invoice.dto';
import { GenerateInvoiceWeightDto } from '../application/dto/generate-invoice-weight.dto';
import { GenerateInvoiceMonthDto } from '../application/dto/generate-invoice-month.dto';
import { UpdateInvoiceDto } from '../application/dto/update-invoice.dto';
import { BulkInvoicePdfJobDto } from '../application/dto/bulk-invoice-pdf-job.dto';
import { InvoiceResponseDto } from '../application/dto/invoice-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { InvoicePdfService } from '../application/services/invoice-pdf.service';
import { InvoiceQueueService } from '../application/services/invoice-queue.service';
import { InvoiceBulkDownloadService } from '../application/services/invoice-bulk-download.service';
import { Invoice } from '../domain/entities/invoice.domain.entity';
import { BulkDownloadStatus } from '../infrastructure/transaction/bulk-download.entity';

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
    private readonly postInvoiceUseCase: PostInvoiceUseCase,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly invoiceQueueService: InvoiceQueueService,
    private readonly invoiceBulkDownloadService: InvoiceBulkDownloadService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    try {
      const invoice = await this.createInvoiceUseCase.execute(
        createInvoiceDto,
        req.user?.userId,
      );
      return {
        success: true,
        data: this.toResponseDto(invoice),
      };
    } catch (error) {
      throw error; // Let the exception filter handle it
    }
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async generate(@Body() generateInvoiceDto: GenerateInvoiceDto, @Request() req: any) {
    try {
      const result = await this.generateInvoiceAutoUseCase.execute(
        generateInvoiceDto,
        req.user?.userId,
      );
      
      // Log failed invoices for debugging
      if (result.failed.length > 0) {
        console.error('Invoice generation failures:', JSON.stringify(result.failed, null, 2));
      }
      
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
    } catch (error) {
      console.error('Error in invoice generation endpoint:', error);
      throw error; // Let the exception filter handle it
    }
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

  @Get(':id/pdf')
  @RequirePermissions('INVOICE_VIEW')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      // First verify invoice exists
      const invoice = await this.getInvoiceUseCase.execute(id);
      const filename = `${invoice.invoiceNumber}.pdf`;
      
      // Generate PDF
      const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(id) as Buffer;
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'PDF generation returned empty buffer',
        });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      });
    }
  }

  @Get(':id/pdf/base64')
  @RequirePermissions('INVOICE_VIEW')
  async getPdfBase64(@Param('id') id: string) {
    try {
      const base64Pdf = await this.invoicePdfService.generateInvoicePdf(id, 'base64') as string;
      const invoice = await this.getInvoiceUseCase.execute(id);
      
      return {
        success: true,
        data: {
          invoiceId: id,
          invoiceNumber: invoice.invoiceNumber,
          pdfBase64: base64Pdf,
          filename: `${invoice.invoiceNumber}.pdf`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      };
    }
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

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('INVOICE_CREATE')
  async postInvoice(
    @Param('id') id: string,
    @Body() body: { invoiceDate?: string },
    @Request() req: any,
  ) {
    const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : new Date();
    if (isNaN(invoiceDate.getTime())) {
      throw new BadRequestException('Invalid invoiceDate format');
    }

    const invoice = await this.postInvoiceUseCase.execute(id, invoiceDate, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(invoice),
      message: 'Invoice posted successfully',
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

  @Post('pdf/bulk')
  @RequirePermissions('INVOICE_VIEW')
  async createBulkPdfJob(@Body() body: BulkInvoicePdfJobDto) {
    const max = parseInt(process.env.MAX_BULK_PDF || '100', 10);

    if (!body.invoiceIds || body.invoiceIds.length === 0) {
      throw new BadRequestException('invoiceIds array is required');
    }

    if (body.invoiceIds.length > max) {
      throw new BadRequestException(`Too many invoiceIds. Max ${max} per request.`);
    }

    const { jobId } = await this.invoiceQueueService.addBulkJob(
      body.invoiceIds,
      body.email,
    );

    return {
      success: true,
      data: { jobId },
      message: 'Processing started',
    };
  }

  @Get('pdf/bulk-downloads')
  @RequirePermissions('INVOICE_VIEW')
  async getBulkDownloadHistory(
    @Query('status') status?: BulkDownloadStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const normalizedStatus =
      status && Object.values(BulkDownloadStatus).includes(status) ? status : undefined;

    const data = await this.invoiceBulkDownloadService.listBulkDownloads({
      status: normalizedStatus,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });

    return {
      success: true,
      data,
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
