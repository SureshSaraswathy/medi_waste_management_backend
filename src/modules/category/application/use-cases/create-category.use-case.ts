import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { Category } from '../../domain/entities/category.domain.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { DuplicateCategoryCodeException, DuplicateCategoryNameException } from '../../domain/exceptions/category.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(createCategoryDto: CreateCategoryDto, createdBy?: string): Promise<Category> {
    const existingByCode = await this.categoryRepository.findByCategoryCode(
      createCategoryDto.categoryCode,
      createCategoryDto.companyId,
    );
    if (existingByCode) {
      throw new DuplicateCategoryCodeException(createCategoryDto.categoryCode);
    }

    const existingByName = await this.categoryRepository.findByCategoryName(
      createCategoryDto.categoryName,
      createCategoryDto.companyId,
    );
    if (existingByName) {
      throw new DuplicateCategoryNameException(createCategoryDto.categoryName);
    }

    const category = Category.create({
      categoryId: randomUUID(),
      categoryCode: createCategoryDto.categoryCode,
      categoryName: createCategoryDto.categoryName,
      companyId: createCategoryDto.companyId,
      createdBy: createdBy || null,
    });

    return this.categoryRepository.create(category);
  }
}
