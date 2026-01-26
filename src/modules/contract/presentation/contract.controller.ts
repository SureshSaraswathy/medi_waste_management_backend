import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { CreateContractUseCase } from '../application/use-cases/create-contract.use-case';
import { GetContractUseCase } from '../application/use-cases/get-contract.use-case';
import { GetAllContractsUseCase } from '../application/use-cases/get-all-contracts.use-case';
import { UpdateContractUseCase } from '../application/use-cases/update-contract.use-case';
import { DeleteContractUseCase } from '../application/use-cases/delete-contract.use-case';
import { CreateContractDto } from '../application/dto/create-contract.dto';
import { UpdateContractDto } from '../application/dto/update-contract.dto';
import { ContractResponseDto } from '../application/dto/contract-response.dto';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class ContractController {
  constructor(
    private readonly createUseCase: CreateContractUseCase,
    private readonly getUseCase: GetContractUseCase,
    private readonly getAllUseCase: GetAllContractsUseCase,
    private readonly updateUseCase: UpdateContractUseCase,
    private readonly deleteUseCase: DeleteContractUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('CONTRACT_CREATE')
  async create(@Body() createDto: CreateContractDto, @Request() req: any) {
    const contract = await this.createUseCase.execute(createDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(contract),
      message: 'Contract created successfully',
    };
  }

  @Get()
  @RequirePermissions('CONTRACT_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    try {
      const contracts = await this.getAllUseCase.execute(companyId, status);
      return {
        success: true,
        data: contracts.map(c => this.toResponseDto(c)),
        message: 'Contracts retrieved successfully',
      };
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('CONTRACT_VIEW')
  async findOne(@Param('id') id: string) {
    const contract = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(contract),
      message: 'Contract retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('CONTRACT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContractDto,
    @Request() req: any,
  ) {
    const contract = await this.updateUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(contract),
      message: 'Contract updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('CONTRACT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(contract: any): ContractResponseDto {
    if (!contract) {
      throw new Error('Contract is null or undefined');
    }

    const formatDate = (date: any): string => {
      if (!date) return '';
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return '';
      }
      return parsed.toISOString().split('T')[0];
    };

    const formatDateTime = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) {
        return date.toISOString();
      }
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return new Date().toISOString();
      }
      return parsed.toISOString();
    };

    return {
      id: contract.contractId,
      contractID: contract.contractID,
      contractNum: contract.contractNum,
      companyId: contract.companyId,
      hcfId: contract.hcfId,
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      billingType: contract.billingType,
      status: contract.status,
      createdBy: contract.createdBy,
      createdOn: formatDateTime(contract.createdOn),
      modifiedBy: contract.modifiedBy,
      modifiedOn: formatDateTime(contract.modifiedOn),
    };
  }
}
