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

  async create(company: Company, additionalFields?: any): Promise<Company> {
    const entity = this.toEntity(company, additionalFields);
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

  async update(companyId: string, company: Company, additionalFields?: any): Promise<Company> {
    // Get existing entity to preserve additional fields if not provided
    const existing = await this.repository.findOne({ where: { companyId } });
    if (!existing) {
      throw new Error('Company not found');
    }

    // Update domain fields
    existing.companyCode = company.companyCode;
    existing.companyName = company.companyName;
    existing.status = company.status;
    existing.modifiedBy = company.modifiedBy;
    existing.modifiedOn = company.modifiedOn;

    // Update additional fields if provided
    if (additionalFields) {
      if (additionalFields.contactNum !== undefined) existing.contactNum = additionalFields.contactNum;
      if (additionalFields.webAddress !== undefined) existing.webAddress = additionalFields.webAddress;
      if (additionalFields.companyEmail !== undefined) existing.companyEmail = additionalFields.companyEmail;
      if (additionalFields.bankAccountName !== undefined) existing.bankAccountName = additionalFields.bankAccountName;
      if (additionalFields.bankName !== undefined) existing.bankName = additionalFields.bankName;
      if (additionalFields.bankAccountNum !== undefined) existing.bankAccountNum = additionalFields.bankAccountNum;
      if (additionalFields.bankIFSCode !== undefined) existing.bankIFSCode = additionalFields.bankIFSCode;
      if (additionalFields.bankBranch !== undefined) existing.bankBranch = additionalFields.bankBranch;
      if (additionalFields.upiId !== undefined) existing.upiId = additionalFields.upiId;
      if (additionalFields.qrCode !== undefined) existing.qrCode = additionalFields.qrCode;
    }

    await this.repository.save(existing);
    const updated = await this.findById(companyId);
    if (!updated) {
      throw new Error('Company not found after update');
    }
    return updated;
  }

  async getEntityById(companyId: string): Promise<CompanyEntity | null> {
    return this.repository.findOne({
      where: { companyId, isDeleted: false },
    });
  }

  async getAllEntities(activeOnly: boolean = false): Promise<CompanyEntity[]> {
    const where: any = { isDeleted: false };
    if (activeOnly) {
      where.status = CompanyStatus.ACTIVE;
    }
    return this.repository.find({
      where,
      order: { createdOn: 'DESC' },
    });
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
   * Note: Additional fields (contact, bank details) are stored directly in entity
   * as they don't require domain business logic
   */
  private toEntity(company: Company, additionalFields?: {
    contactNum?: string | null;
    webAddress?: string | null;
    companyEmail?: string | null;
    bankAccountName?: string | null;
    bankName?: string | null;
    bankAccountNum?: string | null;
    bankIFSCode?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
    qrCode?: string | null;
  }): CompanyEntity {
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
    
    // Map additional fields if provided
    if (additionalFields) {
      entity.contactNum = additionalFields.contactNum;
      entity.webAddress = additionalFields.webAddress;
      entity.companyEmail = additionalFields.companyEmail;
      entity.bankAccountName = additionalFields.bankAccountName;
      entity.bankName = additionalFields.bankName;
      entity.bankAccountNum = additionalFields.bankAccountNum;
      entity.bankIFSCode = additionalFields.bankIFSCode;
      entity.bankBranch = additionalFields.bankBranch;
      entity.upiId = additionalFields.upiId;
      entity.qrCode = additionalFields.qrCode;
    }
    
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
