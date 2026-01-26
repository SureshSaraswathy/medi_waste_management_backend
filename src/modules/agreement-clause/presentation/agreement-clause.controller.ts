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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';
import { CreateAgreementClauseUseCase } from '../application/use-cases/create-agreement-clause.use-case';
import { GetAgreementClauseUseCase } from '../application/use-cases/get-agreement-clause.use-case';
import { GetAllAgreementClausesUseCase } from '../application/use-cases/get-all-agreement-clauses.use-case';
import { UpdateAgreementClauseUseCase } from '../application/use-cases/update-agreement-clause.use-case';
import { DeleteAgreementClauseUseCase } from '../application/use-cases/delete-agreement-clause.use-case';
import { ReorderAgreementClauseUseCase } from '../application/use-cases/reorder-agreement-clause.use-case';
import { CreateAgreementClauseDto } from '../application/dto/create-agreement-clause.dto';
import { UpdateAgreementClauseDto } from '../application/dto/update-agreement-clause.dto';
import { ReorderClauseDto } from '../application/dto/reorder-clause.dto';
import { AgreementClauseResponseDto } from '../application/dto/agreement-clause-response.dto';

@Controller('agreement-clauses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AgreementClauseController {
  constructor(
    private readonly createUseCase: CreateAgreementClauseUseCase,
    private readonly getUseCase: GetAgreementClauseUseCase,
    private readonly getAllUseCase: GetAllAgreementClausesUseCase,
    private readonly updateUseCase: UpdateAgreementClauseUseCase,
    private readonly deleteUseCase: DeleteAgreementClauseUseCase,
    private readonly reorderUseCase: ReorderAgreementClauseUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('AGREEMENT_CLAUSE_CREATE')
  async create(@Body() createDto: CreateAgreementClauseDto, @Request() req: any) {
    const clause = await this.createUseCase.execute(createDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(clause),
      message: 'Agreement clause created successfully',
    };
  }

  @Get()
  @RequirePermissions('AGREEMENT_CLAUSE_VIEW')
  async findAll(@Query('agreementId') agreementId?: string, @Query('status') status?: string) {
    try {
      const clauses = await this.getAllUseCase.execute(agreementId, status);
      return {
        success: true,
        data: clauses.map(c => this.toResponseDto(c)),
        message: 'Agreement clauses retrieved successfully',
      };
    } catch (error: any) {
      console.error('Error fetching agreement clauses:', error);
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('AGREEMENT_CLAUSE_VIEW')
  async findOne(@Param('id') id: string) {
    const clause = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(clause),
      message: 'Agreement clause retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('AGREEMENT_CLAUSE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgreementClauseDto,
    @Request() req: any,
  ) {
    const clause = await this.updateUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(clause),
      message: 'Agreement clause updated successfully',
    };
  }

  @Patch(':id/reorder')
  @RequirePermissions('AGREEMENT_CLAUSE_EDIT')
  async reorder(
    @Param('id') id: string,
    @Body() reorderDto: ReorderClauseDto,
    @Request() req: any,
  ) {
    await this.reorderUseCase.execute(id, reorderDto, req.user?.userId);
    const clause = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(clause),
      message: 'Agreement clause reordered successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('AGREEMENT_CLAUSE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(clause: any): AgreementClauseResponseDto {
    if (!clause) {
      throw new Error('Agreement clause is null or undefined');
    }

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
      id: clause.clauseId,
      agreementClauseID: clause.agreementClauseID,
      agreementId: clause.agreementId,
      pointNum: clause.pointNum,
      pointTitle: clause.pointTitle,
      pointText: clause.pointText,
      sequenceNo: clause.sequenceNo,
      status: clause.status,
      createdBy: clause.createdBy,
      createdOn: formatDateTime(clause.createdOn),
      modifiedBy: clause.modifiedBy,
      modifiedOn: formatDateTime(clause.modifiedOn),
    };
  }
}
