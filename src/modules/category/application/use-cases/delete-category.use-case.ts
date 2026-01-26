import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { CategoryNotFoundException } from '../../domain/exceptions/category.exceptions';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(categoryId: string, modifiedBy?: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }

    category.softDelete(modifiedBy || null);
    await this.categoryRepository.softDelete(categoryId);
  }
}
