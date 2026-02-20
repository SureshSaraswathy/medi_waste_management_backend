import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { BatchService } from '../application/services/batch.service';
import { CreateBatchDto } from '../application/dto/create-batch.dto';
import { BatchResponseDto, BatchPreviewResponseDto } from '../application/dto/batch-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { BatchStatus } from '../infrastructure/transaction/invoice-batch.entity';
import { Invoice } from '../domain/entities/invoice.domain.entity';

@Controller('billing/batches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async createBatch(@Body() createBatchDto: CreateBatchDto, @Request() req: any): Promise<{ success: true; data: BatchResponseDto }> {
    try {
      const batch = await this.batchService.generateBatch(createBatchDto, req.user?.userId);
      return {
        success: true,
        data: batch,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('INVOICE_CREATE')
  async generateDraftInvoices(@Body() createBatchDto: CreateBatchDto, @Request() req: any): Promise<{ success: true; data: { batchId: string; invoiceCount: number } }> {
    try {
      const result = await this.batchService.generateDraftInvoices(createBatchDto, req.user?.userId);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get(':id/draft-invoices')
  @RequirePermissions('INVOICE_VIEW')
  async getDraftInvoices(@Param('id') id: string): Promise<{ success: true; data: any[] }> {
    try {
      const invoices = await this.batchService.getDraftInvoicesByBatch(id);
      return {
        success: true,
        data: invoices.map(inv => this.invoiceToDto(inv)),
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Put('draft-invoices/:invoiceId')
  @RequirePermissions('INVOICE_UPDATE')
  async updateDraftInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() body: { quantity?: number; rate?: number; dueDate?: string },
    @Request() req: any,
  ): Promise<{ success: true; data: any }> {
    try {
      const updates: { quantity?: number; rate?: number; dueDate?: Date } = {};
      if (body.quantity !== undefined) updates.quantity = body.quantity;
      if (body.rate !== undefined) updates.rate = body.rate;
      if (body.dueDate) updates.dueDate = new Date(body.dueDate);

      const invoice = await this.batchService.updateDraftInvoice(invoiceId, updates, req.user?.userId);
      return {
        success: true,
        data: this.invoiceToDto(invoice),
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Post('draft-invoices/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('INVOICE_CREATE')
  async postDraftInvoices(
    @Body() body: { invoiceIds: string[]; invoiceDate: string },
    @Request() req: any,
  ): Promise<{ success: true; data: { success: number; failed: number } }> {
    try {
      if (!body.invoiceDate) {
        throw new BadRequestException('invoiceDate is required');
      }

      const invoiceDate = new Date(body.invoiceDate);
      if (isNaN(invoiceDate.getTime())) {
        throw new BadRequestException('Invalid invoiceDate format');
      }

      const result = await this.batchService.postDraftInvoices(body.invoiceIds, invoiceDate, req.user?.userId);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('INVOICE_VIEW')
  async getBatchPreview(@Param('id') id: string): Promise<{ success: true; data: BatchPreviewResponseDto }> {
    try {
      const batch = await this.batchService.getBatchPreview(id);
      return {
        success: true,
        data: batch,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('INVOICE_CREATE')
  async postBatch(
    @Param('id') id: string,
    @Body() body: { invoiceDate: string },
    @Request() req: any,
  ): Promise<{ success: true; data: { success: number; failed: number } }> {
    try {
      if (!body.invoiceDate) {
        throw new BadRequestException('invoiceDate is required');
      }

      const invoiceDate = new Date(body.invoiceDate);
      if (isNaN(invoiceDate.getTime())) {
        throw new BadRequestException('Invalid invoiceDate format');
      }

      const result = await this.batchService.postBatch(id, invoiceDate, req.user?.userId);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get()
  @RequirePermissions('INVOICE_VIEW')
  async getAllBatches(
    @Query('companyId') companyId?: string,
    @Query('status') status?: BatchStatus,
  ): Promise<{ success: true; data: BatchResponseDto[] }> {
    try {
      const batches = await this.batchService.getAllBatches(companyId, status);
      return {
        success: true,
        data: batches,
      };
    } catch (error: any) {
      throw error;
    }
  }

  private invoiceToDto(invoice: Invoice): any {
    const toDateString = (date: Date | string | null | undefined): string | null => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
      }
      return null;
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
      batchId: invoice.batchId,
      postedAt: invoice.postedAt ? toDateString(invoice.postedAt) : null,
      notes: invoice.notes,
    };
  }
}
