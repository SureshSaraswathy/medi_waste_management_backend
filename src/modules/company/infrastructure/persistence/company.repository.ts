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
    try {
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error: any) {
      // If error is due to missing columns (before migration), try saving without new columns
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Some columns may not exist yet. Attempting save without new columns...');
        // Remove new columns temporarily and save
        const fieldsToRemove = [
          'regdOfficeAddress', 'adminOfficeAddress', 'factoryAddress',
          'authPersonName', 'authPersonDesignation', 'authPersonDOB',
          'pcbauthNum', 'hazardousWasteNum',
          'ctoWaterNum', 'ctoWaterDate', 'ctoWaterValidUpto',
          'ctoAirNum', 'ctoAirDate', 'ctoAirValidUpto',
          'cteWaterNum', 'cteWaterDate', 'cteWaterValidUpto',
          'cteAirNum', 'cteAirDate', 'cteAirValidUpto',
          'pcbZoneID', 'gstValidFrom', 'gstRate'
        ];
        const tempEntity = { ...entity };
        fieldsToRemove.forEach(field => {
          delete (tempEntity as any)[field];
        });
        const saved = await this.repository.save(tempEntity);
        return this.toDomain(saved);
      } else {
        throw error;
      }
    }
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
      if (additionalFields.gstin !== undefined) existing.gstin = additionalFields.gstin;
      if (additionalFields.pincode !== undefined) existing.pincode = additionalFields.pincode;
      if (additionalFields.state !== undefined) existing.state = additionalFields.state;
      if (additionalFields.prefix !== undefined) existing.prefix = additionalFields.prefix;
      // Address Information
      if (additionalFields.regdOfficeAddress !== undefined) existing.regdOfficeAddress = additionalFields.regdOfficeAddress;
      if (additionalFields.adminOfficeAddress !== undefined) existing.adminOfficeAddress = additionalFields.adminOfficeAddress;
      if (additionalFields.factoryAddress !== undefined) existing.factoryAddress = additionalFields.factoryAddress;
      // Authorized Person Information
      if (additionalFields.authPersonName !== undefined) existing.authPersonName = additionalFields.authPersonName;
      if (additionalFields.authPersonDesignation !== undefined) existing.authPersonDesignation = additionalFields.authPersonDesignation;
      if (additionalFields.authPersonDOB !== undefined) existing.authPersonDOB = additionalFields.authPersonDOB;
      // PCB & Compliance
      if (additionalFields.pcbauthNum !== undefined) existing.pcbauthNum = additionalFields.pcbauthNum;
      if (additionalFields.hazardousWasteNum !== undefined) existing.hazardousWasteNum = additionalFields.hazardousWasteNum;
      // CTO (Consent To Operate) - Water
      if (additionalFields.ctoWaterNum !== undefined) existing.ctoWaterNum = additionalFields.ctoWaterNum;
      if (additionalFields.ctoWaterDate !== undefined) existing.ctoWaterDate = additionalFields.ctoWaterDate;
      if (additionalFields.ctoWaterValidUpto !== undefined) existing.ctoWaterValidUpto = additionalFields.ctoWaterValidUpto;
      // CTO (Consent To Operate) - Air
      if (additionalFields.ctoAirNum !== undefined) existing.ctoAirNum = additionalFields.ctoAirNum;
      if (additionalFields.ctoAirDate !== undefined) existing.ctoAirDate = additionalFields.ctoAirDate;
      if (additionalFields.ctoAirValidUpto !== undefined) existing.ctoAirValidUpto = additionalFields.ctoAirValidUpto;
      // CTE (Consent To Establish) - Water
      if (additionalFields.cteWaterNum !== undefined) existing.cteWaterNum = additionalFields.cteWaterNum;
      if (additionalFields.cteWaterDate !== undefined) existing.cteWaterDate = additionalFields.cteWaterDate;
      if (additionalFields.cteWaterValidUpto !== undefined) existing.cteWaterValidUpto = additionalFields.cteWaterValidUpto;
      // CTE (Consent To Establish) - Air
      if (additionalFields.cteAirNum !== undefined) existing.cteAirNum = additionalFields.cteAirNum;
      if (additionalFields.cteAirDate !== undefined) existing.cteAirDate = additionalFields.cteAirDate;
      if (additionalFields.cteAirValidUpto !== undefined) existing.cteAirValidUpto = additionalFields.cteAirValidUpto;
      // GST Details
      if (additionalFields.pcbZoneID !== undefined) existing.pcbZoneID = additionalFields.pcbZoneID;
      if (additionalFields.gstValidFrom !== undefined) existing.gstValidFrom = additionalFields.gstValidFrom;
      if (additionalFields.gstRate !== undefined) existing.gstRate = additionalFields.gstRate;
      // Contact Information
      if (additionalFields.contactNum !== undefined) existing.contactNum = additionalFields.contactNum;
      if (additionalFields.webAddress !== undefined) existing.webAddress = additionalFields.webAddress;
      if (additionalFields.companyEmail !== undefined) existing.companyEmail = additionalFields.companyEmail;
      // Bank & Payment Information
      if (additionalFields.bankAccountName !== undefined) existing.bankAccountName = additionalFields.bankAccountName;
      if (additionalFields.bankName !== undefined) existing.bankName = additionalFields.bankName;
      if (additionalFields.bankAccountNum !== undefined) existing.bankAccountNum = additionalFields.bankAccountNum;
      if (additionalFields.bankIFSCode !== undefined) existing.bankIFSCode = additionalFields.bankIFSCode;
      if (additionalFields.bankBranch !== undefined) existing.bankBranch = additionalFields.bankBranch;
      if (additionalFields.upiId !== undefined) existing.upiId = additionalFields.upiId;
      if (additionalFields.qrCode !== undefined) existing.qrCode = additionalFields.qrCode;
    }

    try {
      await this.repository.save(existing);
    } catch (error: any) {
      // If error is due to missing columns (before migration), try saving without new columns
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Some columns may not exist yet. Attempting save without new columns...');
        // Remove new columns temporarily and save
        const fieldsToRemove = [
          'regdOfficeAddress', 'adminOfficeAddress', 'factoryAddress',
          'authPersonName', 'authPersonDesignation', 'authPersonDOB',
          'pcbauthNum', 'hazardousWasteNum',
          'ctoWaterNum', 'ctoWaterDate', 'ctoWaterValidUpto',
          'ctoAirNum', 'ctoAirDate', 'ctoAirValidUpto',
          'cteWaterNum', 'cteWaterDate', 'cteWaterValidUpto',
          'cteAirNum', 'cteAirDate', 'cteAirValidUpto',
          'pcbZoneID', 'gstValidFrom', 'gstRate'
        ];
        const tempEntity = { ...existing };
        fieldsToRemove.forEach(field => {
          delete (tempEntity as any)[field];
        });
        await this.repository.save(tempEntity);
      } else {
        throw error;
      }
    }
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
    gstin?: string | null;
    pincode?: string | null;
    state?: string | null;
    prefix?: string | null;
    // Address Information
    regdOfficeAddress?: string | null;
    adminOfficeAddress?: string | null;
    factoryAddress?: string | null;
    // Authorized Person Information
    authPersonName?: string | null;
    authPersonDesignation?: string | null;
    authPersonDOB?: Date | null;
    // PCB & Compliance
    pcbauthNum?: string | null;
    hazardousWasteNum?: string | null;
    // CTO (Consent To Operate) - Water
    ctoWaterNum?: string | null;
    ctoWaterDate?: Date | null;
    ctoWaterValidUpto?: Date | null;
    // CTO (Consent To Operate) - Air
    ctoAirNum?: string | null;
    ctoAirDate?: Date | null;
    ctoAirValidUpto?: Date | null;
    // CTE (Consent To Establish) - Water
    cteWaterNum?: string | null;
    cteWaterDate?: Date | null;
    cteWaterValidUpto?: Date | null;
    // CTE (Consent To Establish) - Air
    cteAirNum?: string | null;
    cteAirDate?: Date | null;
    cteAirValidUpto?: Date | null;
    // GST Details
    pcbZoneID?: string | null;
    gstValidFrom?: Date | null;
    gstRate?: string | null;
    // Contact Information
    contactNum?: string | null;
    webAddress?: string | null;
    companyEmail?: string | null;
    // Bank & Payment Information
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
      entity.gstin = additionalFields.gstin;
      entity.pincode = additionalFields.pincode;
      entity.state = additionalFields.state;
      entity.prefix = additionalFields.prefix;
      // Address Information
      entity.regdOfficeAddress = additionalFields.regdOfficeAddress;
      entity.adminOfficeAddress = additionalFields.adminOfficeAddress;
      entity.factoryAddress = additionalFields.factoryAddress;
      // Authorized Person Information
      entity.authPersonName = additionalFields.authPersonName;
      entity.authPersonDesignation = additionalFields.authPersonDesignation;
      entity.authPersonDOB = additionalFields.authPersonDOB;
      // PCB & Compliance
      entity.pcbauthNum = additionalFields.pcbauthNum;
      entity.hazardousWasteNum = additionalFields.hazardousWasteNum;
      // CTO (Consent To Operate) - Water
      entity.ctoWaterNum = additionalFields.ctoWaterNum;
      entity.ctoWaterDate = additionalFields.ctoWaterDate;
      entity.ctoWaterValidUpto = additionalFields.ctoWaterValidUpto;
      // CTO (Consent To Operate) - Air
      entity.ctoAirNum = additionalFields.ctoAirNum;
      entity.ctoAirDate = additionalFields.ctoAirDate;
      entity.ctoAirValidUpto = additionalFields.ctoAirValidUpto;
      // CTE (Consent To Establish) - Water
      entity.cteWaterNum = additionalFields.cteWaterNum;
      entity.cteWaterDate = additionalFields.cteWaterDate;
      entity.cteWaterValidUpto = additionalFields.cteWaterValidUpto;
      // CTE (Consent To Establish) - Air
      entity.cteAirNum = additionalFields.cteAirNum;
      entity.cteAirDate = additionalFields.cteAirDate;
      entity.cteAirValidUpto = additionalFields.cteAirValidUpto;
      // GST Details
      entity.pcbZoneID = additionalFields.pcbZoneID;
      entity.gstValidFrom = additionalFields.gstValidFrom;
      entity.gstRate = additionalFields.gstRate;
      // Contact Information
      entity.contactNum = additionalFields.contactNum;
      entity.webAddress = additionalFields.webAddress;
      entity.companyEmail = additionalFields.companyEmail;
      // Bank & Payment Information
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
