import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { CreateWasteTransactionUseCase } from '../application/use-cases/create-waste-transaction.use-case';
import { GetWasteTransactionUseCase } from '../application/use-cases/get-waste-transaction.use-case';
import { GetAllWasteTransactionsUseCase } from '../application/use-cases/get-all-waste-transactions.use-case';
import { UpdateWasteTransactionUseCase } from '../application/use-cases/update-waste-transaction.use-case';
import { SubmitWasteTransactionUseCase } from '../application/use-cases/submit-waste-transaction.use-case';
import { VerifyWasteTransactionUseCase } from '../application/use-cases/verify-waste-transaction.use-case';
import { DeleteWasteTransactionUseCase } from '../application/use-cases/delete-waste-transaction.use-case';
import { CreateWasteTransactionDto } from '../application/dto/create-waste-transaction.dto';
import { UpdateWasteTransactionDto } from '../application/dto/update-waste-transaction.dto';
import { WasteTransactionResponseDto } from '../application/dto/waste-transaction-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('waste-transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class WasteTransactionController {
  constructor(
    private readonly createWasteTransactionUseCase: CreateWasteTransactionUseCase,
    private readonly getWasteTransactionUseCase: GetWasteTransactionUseCase,
    private readonly getAllWasteTransactionsUseCase: GetAllWasteTransactionsUseCase,
    private readonly updateWasteTransactionUseCase: UpdateWasteTransactionUseCase,
    private readonly submitWasteTransactionUseCase: SubmitWasteTransactionUseCase,
    private readonly verifyWasteTransactionUseCase: VerifyWasteTransactionUseCase,
    private readonly deleteWasteTransactionUseCase: DeleteWasteTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('WASTE_TRANSACTION_CREATE')
  async create(@Body() createWasteTransactionDto: CreateWasteTransactionDto, @Request() req: any) {
    const transaction = await this.createWasteTransactionUseCase.execute(
      createWasteTransactionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Waste transaction created successfully',
    };
  }

  @Get()
  @RequirePermissions('WASTE_TRANSACTION_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('hcfId') hcfId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const transactions = await this.getAllWasteTransactionsUseCase.execute(
      companyId,
      hcfId,
      startDate,
      endDate,
      status,
    );
    return {
      success: true,
      data: transactions.map((t) => this.toResponseDto(t)),
      message: 'Waste transactions retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('WASTE_TRANSACTION_VIEW')
  async findOne(@Param('id') id: string) {
    const transaction = await this.getWasteTransactionUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Waste transaction retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('WASTE_TRANSACTION_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateWasteTransactionDto: UpdateWasteTransactionDto,
    @Request() req: any,
  ) {
    const transaction = await this.updateWasteTransactionUseCase.execute(
      id,
      updateWasteTransactionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Waste transaction updated successfully',
    };
  }

  @Patch(':id/submit')
  @RequirePermissions('WASTE_TRANSACTION_EDIT')
  async submit(@Param('id') id: string, @Request() req: any) {
    const transaction = await this.submitWasteTransactionUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Waste transaction submitted successfully',
    };
  }

  @Patch(':id/verify')
  @RequirePermissions('WASTE_TRANSACTION_VERIFY')
  async verify(@Param('id') id: string, @Request() req: any) {
    const transaction = await this.verifyWasteTransactionUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Waste transaction verified successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('WASTE_TRANSACTION_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteWasteTransactionUseCase.execute(id);
  }

  private toResponseDto(transaction: any): WasteTransactionResponseDto {
    const formatDateTime = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      }
      return new Date().toISOString();
    };

    return {
      id: transaction.id || transaction.wasteTransactionId,
      companyId: transaction.companyId,
      hcfId: transaction.hcfId,
      pickupDate: formatDateTime(transaction.pickupDate),
      isNilPickup: transaction.isNilPickup,
      yellowBagCount: transaction.yellowBagCount,
      redBagCount: transaction.redBagCount,
      whiteBagCount: transaction.whiteBagCount,
      blueBagCount: transaction.blueBagCount,
      yellowWeightKg: transaction.yellowWeightKg,
      redWeightKg: transaction.redWeightKg,
      whiteWeightKg: transaction.whiteWeightKg,
      blueWeightKg: transaction.blueWeightKg,
      latitude: transaction.latitude,
      longitude: transaction.longitude,
      segregationQuality: transaction.segregationQuality,
      status: transaction.status,
      notes: transaction.notes,
      createdBy: transaction.createdBy,
      createdOn: formatDateTime(transaction.createdOn),
      modifiedBy: transaction.modifiedBy,
      modifiedOn: transaction.modifiedOn ? formatDateTime(transaction.modifiedOn) : undefined,
      verifiedBy: transaction.verifiedBy,
      verifiedOn: transaction.verifiedOn ? formatDateTime(transaction.verifiedOn) : undefined,
    };
  }
}
