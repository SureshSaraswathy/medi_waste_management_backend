import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Category } from '../entities/category.domain.entity';

export const CATEGORY_REPOSITORY_TOKEN = 'CATEGORY_REPOSITORY';

export interface ICategoryRepository extends IBaseMasterRepository<Category> {
  findByCategoryCode(categoryCode: string, companyId: string): Promise<Category | null>;
  findByCategoryName(categoryName: string, companyId: string): Promise<Category | null>;
  findByCompany(companyId: string): Promise<Category[]>;
}
