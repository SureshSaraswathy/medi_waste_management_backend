import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { Category } from '../../domain/entities/category.domain.entity';
import { CategoryNotFoundException } from '../../domain/exceptions/category.exceptions';

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(categoryId: string): Promise<Category> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }
    return category;
  }
}
