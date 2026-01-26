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
import { CreateFrequencyUseCase } from '../application/use-cases/create-frequency.use-case';
import { GetFrequencyUseCase } from '../application/use-cases/get-frequency.use-case';
import { GetAllFrequenciesUseCase } from '../application/use-cases/get-all-frequencies.use-case';
import { UpdateFrequencyUseCase } from '../application/use-cases/update-frequency.use-case';
import { DeleteFrequencyUseCase } from '../application/use-cases/delete-frequency.use-case';
import { CreateFrequencyDto } from '../application/dto/create-frequency.dto';
import { UpdateFrequencyDto } from '../application/dto/update-frequency.dto';
import { FrequencyResponseDto } from '../application/dto/frequency-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('frequencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class FrequencyController {
  constructor(
    private readonly createFrequencyUseCase: CreateFrequencyUseCase,
    private readonly getFrequencyUseCase: GetFrequencyUseCase,
    private readonly getAllFrequenciesUseCase: GetAllFrequenciesUseCase,
    private readonly updateFrequencyUseCase: UpdateFrequencyUseCase,
    private readonly deleteFrequencyUseCase: DeleteFrequencyUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('FREQUENCY_CREATE')
  async create(@Body() createFrequencyDto: CreateFrequencyDto, @Request() req: any) {
    const frequency = await this.createFrequencyUseCase.execute(
      createFrequencyDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(frequency),
      message: 'Frequency created successfully',
    };
  }

  @Get()
  @RequirePermissions('FREQUENCY_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const frequencies = await this.getAllFrequenciesUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: frequencies.map((f) => this.toResponseDto(f)),
      message: 'Frequencies retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('FREQUENCY_VIEW')
  async findOne(@Param('id') id: string) {
    const frequency = await this.getFrequencyUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(frequency),
      message: 'Frequency retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('FREQUENCY_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateFrequencyDto: UpdateFrequencyDto,
    @Request() req: any,
  ) {
    const frequency = await this.updateFrequencyUseCase.execute(
      id,
      updateFrequencyDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(frequency),
      message: 'Frequency updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('FREQUENCY_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteFrequencyUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(frequency: any): FrequencyResponseDto {
    return {
      id: frequency.frequencyId,
      frequencyCode: frequency.frequencyCode,
      frequencyName: frequency.frequencyName,
      companyId: frequency.companyId,
      status: frequency.status,
      createdBy: frequency.createdBy,
      createdOn: frequency.createdOn.toISOString(),
      modifiedBy: frequency.modifiedBy,
      modifiedOn: frequency.modifiedOn.toISOString(),
    };
  }
}
