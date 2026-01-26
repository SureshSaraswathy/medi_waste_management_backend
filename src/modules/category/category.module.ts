import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './presentation/category.controller';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { GetAllCategoriesUseCase } from './application/use-cases/get-all-categories.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { CATEGORY_REPOSITORY_TOKEN } from './domain/interfaces/category.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity], 'master')],
  controllers: [CategoryController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY_TOKEN,
      useClass: CategoryRepository,
    },
    CreateCategoryUseCase,
    GetCategoryUseCase,
    GetAllCategoriesUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
  exports: [CATEGORY_REPOSITORY_TOKEN],
})
export class CategoryModule {}
