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
import { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case';
import { GetCategoryUseCase } from '../application/use-cases/get-category.use-case';
import { GetAllCategoriesUseCase } from '../application/use-cases/get-all-categories.use-case';
import { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case';
import { CreateCategoryDto } from '../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../application/dto/update-category.dto';
import { CategoryResponseDto } from '../application/dto/category-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('CATEGORY_CREATE')
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: any) {
    const category = await this.createCategoryUseCase.execute(
      createCategoryDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(category),
      message: 'Category created successfully',
    };
  }

  @Get()
  @RequirePermissions('CATEGORY_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const categories = await this.getAllCategoriesUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: categories.map((c) => this.toResponseDto(c)),
      message: 'Categories retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('CATEGORY_VIEW')
  async findOne(@Param('id') id: string) {
    const category = await this.getCategoryUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(category),
      message: 'Category retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('CATEGORY_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: any,
  ) {
    const category = await this.updateCategoryUseCase.execute(
      id,
      updateCategoryDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(category),
      message: 'Category updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('CATEGORY_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteCategoryUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(category: any): CategoryResponseDto {
    return {
      id: category.categoryId,
      categoryCode: category.categoryCode,
      categoryName: category.categoryName,
      companyId: category.companyId,
      status: category.status,
      createdBy: category.createdBy,
      createdOn: category.createdOn.toISOString(),
      modifiedBy: category.modifiedBy,
      modifiedOn: category.modifiedOn.toISOString(),
    };
  }
}
