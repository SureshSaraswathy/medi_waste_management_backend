import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICategoryRepository, CATEGORY_REPOSITORY_TOKEN } from '../../domain/interfaces/category.repository.interface';
import { Category } from '../../domain/entities/category.domain.entity';
import { CategoryEntity } from './category.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity, 'master')
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async create(category: Category): Promise<Category> {
    const entity = this.toEntity(category);
    const saved = await this.categoryRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(categoryId: string): Promise<Category | null> {
    const entity = await this.categoryRepo.findOne({
      where: { categoryId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Category[]> {
    const entities = await this.categoryRepo.find({
      where: { isDeleted: false },
      order: { categoryName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Category[]> {
    const entities = await this.categoryRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { categoryName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(categoryId: string, category: Category): Promise<Category> {
    const entity = this.toEntity(category);
    await this.categoryRepo.update({ categoryId }, entity);
    const updated = await this.findById(categoryId);
    if (!updated) {
      throw new Error(`Category ${categoryId} not found after update`);
    }
    return updated;
  }

  async softDelete(categoryId: string): Promise<void> {
    await this.categoryRepo.update(
      { categoryId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByCategoryCode(categoryCode: string, companyId: string): Promise<Category | null> {
    const entity = await this.categoryRepo.findOne({
      where: { categoryCode, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCategoryName(categoryName: string, companyId: string): Promise<Category | null> {
    const entity = await this.categoryRepo.findOne({
      where: { categoryName, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Category[]> {
    const entities = await this.categoryRepo.find({
      where: { companyId, isDeleted: false },
      order: { categoryName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.categoryId = category.categoryId;
    entity.categoryCode = category.categoryCode;
    entity.categoryName = category.categoryName;
    entity.companyId = category.companyId;
    entity.status = category.status;
    entity.createdBy = category.createdBy;
    entity.createdOn = category.createdOn;
    entity.modifiedBy = category.modifiedBy;
    entity.modifiedOn = category.modifiedOn;
    entity.isDeleted = category.isDeleted;
    return entity;
  }

  private toDomain(entity: CategoryEntity): Category {
    return Category.reconstitute({
      categoryId: entity.categoryId,
      categoryCode: entity.categoryCode,
      categoryName: entity.categoryName,
      companyId: entity.companyId,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
