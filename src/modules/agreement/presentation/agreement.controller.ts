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
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { CreateAgreementUseCase } from '../application/use-cases/create-agreement.use-case';
import { GetAgreementUseCase } from '../application/use-cases/get-agreement.use-case';
import { GetAllAgreementsUseCase } from '../application/use-cases/get-all-agreements.use-case';
import { UpdateAgreementUseCase } from '../application/use-cases/update-agreement.use-case';
import { DeleteAgreementUseCase } from '../application/use-cases/delete-agreement.use-case';
import { CreateAgreementDto } from '../application/dto/create-agreement.dto';
import { UpdateAgreementDto } from '../application/dto/update-agreement.dto';
import { AgreementResponseDto } from '../application/dto/agreement-response.dto';

@Controller('agreements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AgreementController {
  constructor(
    private readonly createUseCase: CreateAgreementUseCase,
    private readonly getUseCase: GetAgreementUseCase,
    private readonly getAllUseCase: GetAllAgreementsUseCase,
    private readonly updateUseCase: UpdateAgreementUseCase,
    private readonly deleteUseCase: DeleteAgreementUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('AGREEMENT_CREATE')
  async create(@Body() createDto: CreateAgreementDto, @Request() req: any) {
    const agreement = await this.createUseCase.execute(createDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(agreement),
      message: 'Agreement created successfully',
    };
  }

  @Get()
  @RequirePermissions('AGREEMENT_VIEW')
  async findAll(@Query('contractId') contractId?: string, @Query('status') status?: string) {
    try {
      const agreements = await this.getAllUseCase.execute(contractId, status);
      return {
        success: true,
        data: agreements.map(a => this.toResponseDto(a)),
        message: 'Agreements retrieved successfully',
      };
    } catch (error: any) {
      console.error('Error fetching agreements:', error);
      throw error;
    }
  }

  @Get(':id/download')
  @RequirePermissions('AGREEMENT_VIEW')
  async downloadPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const agreement = await this.getUseCase.execute(id);
      if (!agreement) {
        throw new NotFoundException('Agreement not found');
      }

      // TODO: Implement PDF generation
      // For now, return a proper error response
      return res.status(HttpStatus.NOT_IMPLEMENTED).json({
        success: false,
        message: 'PDF generation is not yet implemented',
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('AGREEMENT_VIEW')
  async findOne(@Param('id') id: string) {
    const agreement = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(agreement),
      message: 'Agreement retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('AGREEMENT_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgreementDto,
    @Request() req: any,
  ) {
    const agreement = await this.updateUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(agreement),
      message: 'Agreement updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('AGREEMENT_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(agreement: any): AgreementResponseDto {
    if (!agreement) {
      throw new Error('Agreement is null or undefined');
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
      id: agreement.agreementId,
      agreementID: agreement.agreementID,
      agreementNum: agreement.agreementNum,
      contractId: agreement.contractId,
      agreementDate: formatDate(agreement.agreementDate),
      status: agreement.status,
      createdBy: agreement.createdBy,
      createdOn: formatDateTime(agreement.createdOn),
      modifiedBy: agreement.modifiedBy,
      modifiedOn: formatDateTime(agreement.modifiedOn),
    };
  }
}
