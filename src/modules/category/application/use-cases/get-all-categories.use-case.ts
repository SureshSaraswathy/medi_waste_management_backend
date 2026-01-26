import { Injectable, Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { Category } from '../../domain/entities/category.domain.entity';

@Injectable()
export class GetAllCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Category[]> {
    if (companyId) {
      return this.categoryRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.categoryRepository.findAllActive();
    }
    return this.categoryRepository.findAll();
  }
}
