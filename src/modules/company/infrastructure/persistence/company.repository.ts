import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ICompanyRepository,
  COMPANY_REPOSITORY_TOKEN,
} from '../../domain/interfaces/company.repository.interface';
import { Company, CompanyStatus } from '../../domain/entities/company.domain.entity';
import { CompanyEntity } from './company.entity';

/**
 * TypeORM Repository Implementation
 * Infrastructure layer - implements domain repository interface
 */
@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity, 'master')
    private readonly repository: Repository<CompanyEntity>,
  ) {}

  async create(company: Company): Promise<Company> {
    const entity = this.toEntity(company);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(companyId: string): Promise<Company | null> {
    const entity = await this.repository.findOne({
      where: { companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(companyCode: string): Promise<Company | null> {
    const entity = await this.repository.findOne({
      where: { companyCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(companyId: string, company: Company): Promise<Company> {
    const entity = this.toEntity(company);
    await this.repository.update(companyId, entity);
    const updated = await this.findById(companyId);
    if (!updated) {
      throw new Error('Company not found after update');
    }
    return updated;
  }

  async delete(companyId: string): Promise<void> {
    await this.repository.update(companyId, { isDeleted: true });
  }

  async findAll(): Promise<Company[]> {
    const entities = await this.repository.find({
      where: { isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActive(): Promise<Company[]> {
    const entities = await this.repository.find({
      where: { status: CompanyStatus.ACTIVE, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Map Domain Entity to TypeORM Entity
   */
  private toEntity(company: Company): CompanyEntity {
    const entity = new CompanyEntity();
    entity.companyId = company.companyId;
    entity.companyCode = company.companyCode;
    entity.companyName = company.companyName;
    entity.status = company.status;
    entity.createdBy = company.createdBy;
    entity.createdOn = company.createdOn;
    entity.modifiedBy = company.modifiedBy;
    entity.modifiedOn = company.modifiedOn;
    entity.isDeleted = company.isDeleted;
    return entity;
  }

  /**
   * Map TypeORM Entity to Domain Entity
   */
  private toDomain(entity: CompanyEntity): Company {
    return Company.reconstitute({
      companyId: entity.companyId,
      companyCode: entity.companyCode,
      companyName: entity.companyName,
      status: entity.status as CompanyStatus,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
