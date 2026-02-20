import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';
import { HcfEntity } from './hcf.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class HcfRepository implements IHcfRepository {
  constructor(
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepo: Repository<HcfEntity>,
  ) {}

  async create(hcf: Hcf): Promise<Hcf> {
    const entity = this.toEntity(hcf);
    const saved = await this.hcfRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(hcfId: string): Promise<Hcf | null> {
    const entity = await this.hcfRepo.findOne({
      where: { hcfId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Hcf[]> {
    const entities = await this.hcfRepo.find({
      where: { isDeleted: false },
      order: { hcfName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Hcf[]> {
    const entities = await this.hcfRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { hcfName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(hcfId: string, hcf: Hcf): Promise<Hcf> {
    const entity = this.toEntity(hcf);
    await this.hcfRepo.update({ hcfId }, entity);
    const updated = await this.findById(hcfId);
    if (!updated) {
      throw new Error(`HCF ${hcfId} not found after update`);
    }
    return updated;
  }

  async softDelete(hcfId: string): Promise<void> {
    await this.hcfRepo.update(
      { hcfId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByHcfCode(hcfCode: string, companyId: string): Promise<Hcf | null> {
    const entity = await this.hcfRepo.findOne({
      where: { hcfCode, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Hcf[]> {
    const entities = await this.hcfRepo.find({
      where: { companyId, isDeleted: false },
      order: { hcfName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCode(hcfCode: string): Promise<Hcf | null> {
    // Case-insensitive search for HCF code
    const normalizedCode = hcfCode.trim().toUpperCase();
    const entity = await this.hcfRepo
      .createQueryBuilder('hcf')
      .where('UPPER(hcf.hcf_code) = :code', { code: normalizedCode })
      .andWhere('hcf.is_deleted = false')
      .andWhere('hcf.login_enabled = true')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByCodeOrEmail(identifier: string): Promise<Hcf | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const entity = await this.hcfRepo
      .createQueryBuilder('hcf')
      .where('LOWER(hcf.hcf_code) = :identifier', { identifier: normalizedIdentifier })
      .orWhere('LOWER(hcf.contact_email) = :identifier', { identifier: normalizedIdentifier })
      .orWhere('LOWER(hcf.accounts_email) = :identifier', { identifier: normalizedIdentifier })
      .andWhere('hcf.is_deleted = false')
      .andWhere('hcf.login_enabled = true')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByResetToken(token: string): Promise<Hcf | null> {
    const entity = await this.hcfRepo.findOne({
      where: { resetToken: token, isDeleted: false, loginEnabled: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(hcf: Hcf): HcfEntity {
    const entity = new HcfEntity();
    entity.hcfId = hcf.hcfId;
    entity.hcfCode = hcf.hcfCode;
    entity.companyId = hcf.companyId;
    entity.password = hcf.password;
    entity.loginEnabled = hcf.loginEnabled;
    entity.passwordHash = hcf.passwordHash;
    entity.forcePasswordChange = hcf.forcePasswordChange;
    entity.temporaryPassword = hcf.temporaryPassword;
    entity.temporaryPasswordExpiry = hcf.temporaryPasswordExpiry;
    entity.passwordChangedAt = hcf.passwordChangedAt;
    entity.passwordExpiresAt = hcf.passwordExpiresAt;
    entity.lastLogin = hcf.lastLogin;
    entity.resetToken = hcf.resetToken;
    entity.resetTokenExpiry = hcf.resetTokenExpiry;
    entity.hcfTypeCode = hcf.hcfTypeCode;
    entity.hcfName = hcf.hcfName;
    entity.hcfShortName = hcf.hcfShortName;
    entity.areaId = hcf.areaId;
    entity.pincode = hcf.pincode;
    entity.district = hcf.district;
    entity.stateCode = hcf.stateCode;
    entity.groupCode = hcf.groupCode;
    entity.pcbZone = hcf.pcbZone;
    entity.billingName = hcf.billingName;
    entity.billingAddress = hcf.billingAddress;
    entity.serviceAddress = hcf.serviceAddress;
    entity.gstin = hcf.gstin;
    entity.regnNum = hcf.regnNum;
    entity.hospRegnDate = hcf.hospRegnDate;
    entity.billingType = hcf.billingType;
    entity.advAmount = hcf.advAmount;
    entity.billingOption = hcf.billingOption;
    entity.bedCount = hcf.bedCount;
    entity.bedRate = hcf.bedRate;
    entity.kgRate = hcf.kgRate;
    entity.lumpsum = hcf.lumpsum;
    entity.accountsLandline = hcf.accountsLandline;
    entity.accountsMobile = hcf.accountsMobile;
    entity.accountsEmail = hcf.accountsEmail;
    entity.contactName = hcf.contactName;
    entity.contactDesignation = hcf.contactDesignation;
    entity.contactMobile = hcf.contactMobile;
    entity.contactEmail = hcf.contactEmail;
    entity.agrSignAuthName = hcf.agrSignAuthName;
    entity.agrSignAuthDesignation = hcf.agrSignAuthDesignation;
    entity.drName = hcf.drName;
    entity.drPhNo = hcf.drPhNo;
    entity.drEmail = hcf.drEmail;
    entity.serviceStartDate = hcf.serviceStartDate;
    entity.serviceEndDate = hcf.serviceEndDate;
    entity.category = hcf.category;
    entity.route = hcf.route;
    entity.executiveAssigned = hcf.executiveAssigned;
    entity.submitBy = hcf.submitBy;
    entity.agrID = hcf.agrID;
    entity.sortOrder = hcf.sortOrder;
    entity.isGovt = hcf.isGovt;
    entity.isGSTExempt = hcf.isGSTExempt;
    entity.autoGen = hcf.autoGen;
    entity.status = hcf.status;
    entity.createdBy = hcf.createdBy;
    entity.createdOn = hcf.createdOn;
    entity.modifiedBy = hcf.modifiedBy;
    entity.modifiedOn = hcf.modifiedOn;
    entity.isDeleted = hcf.isDeleted;
    return entity;
  }

  private toDomain(entity: HcfEntity): Hcf {
    return Hcf.reconstitute({
      hcfId: entity.hcfId,
      hcfCode: entity.hcfCode,
      companyId: entity.companyId,
      password: entity.password,
      loginEnabled: entity.loginEnabled,
      passwordHash: entity.passwordHash,
      forcePasswordChange: entity.forcePasswordChange,
      temporaryPassword: entity.temporaryPassword,
      temporaryPasswordExpiry: entity.temporaryPasswordExpiry,
      passwordChangedAt: entity.passwordChangedAt,
      passwordExpiresAt: entity.passwordExpiresAt,
      lastLogin: entity.lastLogin,
      resetToken: entity.resetToken,
      resetTokenExpiry: entity.resetTokenExpiry,
      hcfTypeCode: entity.hcfTypeCode,
      hcfName: entity.hcfName,
      hcfShortName: entity.hcfShortName,
      areaId: entity.areaId,
      pincode: entity.pincode,
      district: entity.district,
      stateCode: entity.stateCode,
      groupCode: entity.groupCode,
      pcbZone: entity.pcbZone,
      billingName: entity.billingName,
      billingAddress: entity.billingAddress,
      serviceAddress: entity.serviceAddress,
      gstin: entity.gstin,
      regnNum: entity.regnNum,
      hospRegnDate: entity.hospRegnDate,
      billingType: entity.billingType,
      advAmount: entity.advAmount,
      billingOption: entity.billingOption,
      bedCount: entity.bedCount,
      bedRate: entity.bedRate,
      kgRate: entity.kgRate,
      lumpsum: entity.lumpsum,
      accountsLandline: entity.accountsLandline,
      accountsMobile: entity.accountsMobile,
      accountsEmail: entity.accountsEmail,
      contactName: entity.contactName,
      contactDesignation: entity.contactDesignation,
      contactMobile: entity.contactMobile,
      contactEmail: entity.contactEmail,
      agrSignAuthName: entity.agrSignAuthName,
      agrSignAuthDesignation: entity.agrSignAuthDesignation,
      drName: entity.drName,
      drPhNo: entity.drPhNo,
      drEmail: entity.drEmail,
      serviceStartDate: entity.serviceStartDate,
      serviceEndDate: entity.serviceEndDate,
      category: entity.category,
      route: entity.route,
      executiveAssigned: entity.executiveAssigned,
      submitBy: entity.submitBy,
      agrID: entity.agrID,
      sortOrder: entity.sortOrder,
      isGovt: entity.isGovt,
      isGSTExempt: entity.isGSTExempt,
      autoGen: entity.autoGen,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
