import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { Category } from '../../domain/entities/category.domain.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryNotFoundException } from '../../domain/exceptions/category.exceptions';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(categoryId: string, updateCategoryDto: UpdateCategoryDto, modifiedBy?: string): Promise<Category> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }

    category.update({
      status: updateCategoryDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.categoryRepository.update(categoryId, category);
  }
}
