import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfType } from '../../domain/entities/hcf-type.domain.entity';
import { HcfTypeEntity } from './hcf-type.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class HcfTypeRepository implements IHcfTypeRepository {
  constructor(
    @InjectRepository(HcfTypeEntity, 'master')
    private readonly hcfTypeRepo: Repository<HcfTypeEntity>,
  ) {}

  async create(hcfType: HcfType): Promise<HcfType> {
    const entity = this.toEntity(hcfType);
    const saved = await this.hcfTypeRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(hcfTypeId: string): Promise<HcfType | null> {
    const entity = await this.hcfTypeRepo.findOne({
      where: { hcfTypeId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<HcfType[]> {
    const entities = await this.hcfTypeRepo.find({
      where: { isDeleted: false },
      order: { hcfTypeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<HcfType[]> {
    const entities = await this.hcfTypeRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { hcfTypeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(hcfTypeId: string, hcfType: HcfType): Promise<HcfType> {
    const entity = this.toEntity(hcfType);
    await this.hcfTypeRepo.update({ hcfTypeId }, entity);
    const updated = await this.findById(hcfTypeId);
    if (!updated) {
      throw new Error(`HCF Type ${hcfTypeId} not found after update`);
    }
    return updated;
  }

  async softDelete(hcfTypeId: string): Promise<void> {
    await this.hcfTypeRepo.update(
      { hcfTypeId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByHcfTypeCode(hcfTypeCode: string, companyId: string): Promise<HcfType | null> {
    const entity = await this.hcfTypeRepo.findOne({
      where: { hcfTypeCode, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByHcfTypeName(hcfTypeName: string, companyId: string): Promise<HcfType | null> {
    const entity = await this.hcfTypeRepo.findOne({
      where: { hcfTypeName, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<HcfType[]> {
    const entities = await this.hcfTypeRepo.find({
      where: { companyId, isDeleted: false },
      order: { hcfTypeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(hcfType: HcfType): HcfTypeEntity {
    const entity = new HcfTypeEntity();
    entity.hcfTypeId = hcfType.hcfTypeId;
    entity.hcfTypeCode = hcfType.hcfTypeCode;
    entity.hcfTypeName = hcfType.hcfTypeName;
    entity.companyId = hcfType.companyId;
    entity.status = hcfType.status;
    entity.createdBy = hcfType.createdBy;
    entity.createdOn = hcfType.createdOn;
    entity.modifiedBy = hcfType.modifiedBy;
    entity.modifiedOn = hcfType.modifiedOn;
    entity.isDeleted = hcfType.isDeleted;
    return entity;
  }

  private toDomain(entity: HcfTypeEntity): HcfType {
    return HcfType.reconstitute({
      hcfTypeId: entity.hcfTypeId,
      hcfTypeCode: entity.hcfTypeCode,
      hcfTypeName: entity.hcfTypeName,
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
