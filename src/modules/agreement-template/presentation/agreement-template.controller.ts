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
import { CreateAgreementTemplateUseCase } from '../application/use-cases/create-agreement-template.use-case';
import { GetAgreementTemplateUseCase } from '../application/use-cases/get-agreement-template.use-case';
import { GetAllAgreementTemplatesUseCase } from '../application/use-cases/get-all-agreement-templates.use-case';
import { UpdateAgreementTemplateUseCase } from '../application/use-cases/update-agreement-template.use-case';
import { DeleteAgreementTemplateUseCase } from '../application/use-cases/delete-agreement-template.use-case';
import { CreateAgreementTemplateDto } from '../application/dto/create-agreement-template.dto';
import { UpdateAgreementTemplateDto } from '../application/dto/update-agreement-template.dto';
import { AgreementTemplateResponseDto } from '../application/dto/agreement-template-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('agreement-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AgreementTemplateController {
  constructor(
    private readonly createUseCase: CreateAgreementTemplateUseCase,
    private readonly getUseCase: GetAgreementTemplateUseCase,
    private readonly getAllUseCase: GetAllAgreementTemplatesUseCase,
    private readonly updateUseCase: UpdateAgreementTemplateUseCase,
    private readonly deleteUseCase: DeleteAgreementTemplateUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('AGREEMENT_TEMPLATE_CREATE')
  async create(@Body() createDto: CreateAgreementTemplateDto, @Request() req: any) {
    const template = await this.createUseCase.execute(createDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(template),
      message: 'Agreement template created successfully',
    };
  }

  @Get()
  @RequirePermissions('AGREEMENT_TEMPLATE_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const templates = await this.getAllUseCase.execute(activeOnly === 'true');
    return {
      success: true,
      data: templates.map((t) => this.toResponseDto(t)),
      message: 'Agreement templates retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('AGREEMENT_TEMPLATE_VIEW')
  async findOne(@Param('id') id: string) {
    const template = await this.getUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(template),
      message: 'Agreement template retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('AGREEMENT_TEMPLATE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgreementTemplateDto,
    @Request() req: any,
  ) {
    const template = await this.updateUseCase.execute(id, updateDto, req.user?.userId);
    return {
      success: true,
      data: this.toResponseDto(template),
      message: 'Agreement template updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('AGREEMENT_TEMPLATE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(template: any): AgreementTemplateResponseDto {
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
      id: template.templateId,
      templateCode: template.templateCode,
      templateName: template.templateName,
      agreementCategory: template.agreementCategory,
      templateDescription: template.templateDescription,
      status: template.status,
      createdBy: template.createdBy,
      createdOn: formatDateTime(template.createdOn),
      modifiedBy: template.modifiedBy,
      modifiedOn: formatDateTime(template.modifiedOn),
    };
  }
}
