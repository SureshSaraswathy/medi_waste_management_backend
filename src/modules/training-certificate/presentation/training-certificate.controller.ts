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
import { TrainingCertificateResponseDto } from '../application/dto/training-certificate-response.dto';
import { CreateTrainingCertificateDto } from '../application/dto/create-training-certificate.dto';
import { UpdateTrainingCertificateDto } from '../application/dto/update-training-certificate.dto';
import { CreateTrainingCertificateUseCase } from '../application/use-cases/create-training-certificate.use-case';
import { GetTrainingCertificateUseCase } from '../application/use-cases/get-training-certificate.use-case';
import { GetAllTrainingCertificatesUseCase } from '../application/use-cases/get-all-training-certificates.use-case';
import { UpdateTrainingCertificateUseCase } from '../application/use-cases/update-training-certificate.use-case';
import { DeleteTrainingCertificateUseCase } from '../application/use-cases/delete-training-certificate.use-case';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('training-certificates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class TrainingCertificateController {
  constructor(
    private readonly createUseCase: CreateTrainingCertificateUseCase,
    private readonly getUseCase: GetTrainingCertificateUseCase,
    private readonly getAllUseCase: GetAllTrainingCertificatesUseCase,
    private readonly updateUseCase: UpdateTrainingCertificateUseCase,
    private readonly deleteUseCase: DeleteTrainingCertificateUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('TRAINING_CERTIFICATE_CREATE')
  async create(@Body() createDto: CreateTrainingCertificateDto, @Request() req: any) {
    const certificate = await this.createUseCase.execute(createDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(certificate),
      message: 'Training certificate created successfully',
    };
  }

  @Get()
  @RequirePermissions('TRAINING_CERTIFICATE_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('hcfId') hcfId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    try {
      const filters: any = {};
      if (hcfId) filters.hcfId = hcfId;
      if (status) filters.status = status;
      if (dateFrom) {
        const parsedDate = new Date(dateFrom);
        if (!isNaN(parsedDate.getTime())) {
          filters.dateFrom = parsedDate;
        }
      }
      if (dateTo) {
        const parsedDate = new Date(dateTo);
        if (!isNaN(parsedDate.getTime())) {
          filters.dateTo = parsedDate;
        }
      }
      if (search) filters.search = search;

      const certificates = await this.getAllUseCase.execute(
        companyId,
        activeOnly === 'true',
        Object.keys(filters).length > 0 ? filters : undefined,
      );
      return {
        success: true,
        data: certificates.map((c) => this.toResponseDto(c)),
        message: 'Training certificates retrieved successfully',
      };
    } catch (error: any) {
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('TRAINING_CERTIFICATE_VIEW')
  async findOne(@Param('id') id: string) {
    const certificate = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(certificate),
      message: 'Training certificate retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('TRAINING_CERTIFICATE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingCertificateDto,
    @Request() req: any,
  ) {
    const certificate = await this.updateUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(certificate),
      message: 'Training certificate updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('TRAINING_CERTIFICATE_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteUseCase.execute(id);
  }

  private toResponseDto(certificate: any): TrainingCertificateResponseDto {
    if (!certificate) {
      throw new Error('Certificate is null or undefined');
    }
    return {
      id: certificate.certificateId,
      certificateNo: certificate.certificateNo,
      staffName: certificate.staffName,
      staffCode: certificate.staffCode,
      designation: certificate.designation || '',
      hcfId: certificate.hcfId,
      trainingDate: certificate.trainingDate
        ? (certificate.trainingDate instanceof Date
            ? certificate.trainingDate.toISOString().split('T')[0]
            : new Date(certificate.trainingDate).toISOString().split('T')[0])
        : '',
      companyId: certificate.companyId,
      trainedBy: certificate.trainedBy,
      status: certificate.status,
      createdBy: certificate.createdBy,
      createdOn: certificate.createdOn
        ? (certificate.createdOn instanceof Date
            ? certificate.createdOn.toISOString()
            : new Date(certificate.createdOn).toISOString())
        : new Date().toISOString(),
      modifiedBy: certificate.modifiedBy,
      modifiedOn: certificate.modifiedOn
        ? (certificate.modifiedOn instanceof Date
            ? certificate.modifiedOn.toISOString()
            : new Date(certificate.modifiedOn).toISOString())
        : new Date().toISOString(),
    };
  }
}
