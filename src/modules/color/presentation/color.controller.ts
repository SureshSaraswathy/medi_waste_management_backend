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
import { CreateColorUseCase } from '../application/use-cases/create-color.use-case';
import { GetColorUseCase } from '../application/use-cases/get-color.use-case';
import { GetAllColorsUseCase } from '../application/use-cases/get-all-colors.use-case';
import { UpdateColorUseCase } from '../application/use-cases/update-color.use-case';
import { DeleteColorUseCase } from '../application/use-cases/delete-color.use-case';
import { CreateColorDto } from '../application/dto/create-color.dto';
import { UpdateColorDto } from '../application/dto/update-color.dto';
import { ColorResponseDto } from '../application/dto/color-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('colors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class ColorController {
  constructor(
    private readonly createColorUseCase: CreateColorUseCase,
    private readonly getColorUseCase: GetColorUseCase,
    private readonly getAllColorsUseCase: GetAllColorsUseCase,
    private readonly updateColorUseCase: UpdateColorUseCase,
    private readonly deleteColorUseCase: DeleteColorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('COLOR_CREATE')
  async create(@Body() createColorDto: CreateColorDto, @Request() req: any) {
    const color = await this.createColorUseCase.execute(
      createColorDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(color),
      message: 'Color created successfully',
    };
  }

  @Get()
  @RequirePermissions('COLOR_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const colors = await this.getAllColorsUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: colors.map((c) => this.toResponseDto(c)),
      message: 'Colors retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('COLOR_VIEW')
  async findOne(@Param('id') id: string) {
    const color = await this.getColorUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(color),
      message: 'Color retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('COLOR_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateColorDto: UpdateColorDto,
    @Request() req: any,
  ) {
    const color = await this.updateColorUseCase.execute(
      id,
      updateColorDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(color),
      message: 'Color updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('COLOR_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteColorUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(color: any): ColorResponseDto {
    return {
      id: color.colorId,
      colorName: color.colorName,
      companyId: color.companyId,
      status: color.status,
      createdBy: color.createdBy,
      createdOn: color.createdOn.toISOString(),
      modifiedBy: color.modifiedBy,
      modifiedOn: color.modifiedOn.toISOString(),
    };
  }
}
