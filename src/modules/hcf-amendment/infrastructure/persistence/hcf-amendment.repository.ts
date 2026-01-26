import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';
import { HcfAmendmentEntity } from './hcf-amendment.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class HcfAmendmentRepository implements IHcfAmendmentRepository {
  constructor(
    @InjectRepository(HcfAmendmentEntity, 'master')
    private readonly hcfAmendmentRepo: Repository<HcfAmendmentEntity>,
  ) {}

  async create(hcfAmendment: HcfAmendment): Promise<HcfAmendment> {
    const entity = this.toEntity(hcfAmendment);
    const saved = await this.hcfAmendmentRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(hcfAmendmentId: string): Promise<HcfAmendment | null> {
    const entity = await this.hcfAmendmentRepo.findOne({
      where: { hcfAmendmentId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<HcfAmendment[]> {
    const entities = await this.hcfAmendmentRepo.find({
      where: { isDeleted: false },
      order: { amendmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<HcfAmendment[]> {
    const entities = await this.hcfAmendmentRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { amendmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(hcfAmendmentId: string, hcfAmendment: HcfAmendment): Promise<HcfAmendment> {
    const entity = this.toEntity(hcfAmendment);
    await this.hcfAmendmentRepo.update({ hcfAmendmentId }, entity);
    const updated = await this.findById(hcfAmendmentId);
    if (!updated) {
      throw new Error(`HcfAmendment ${hcfAmendmentId} not found after update`);
    }
    return updated;
  }

  async softDelete(hcfAmendmentId: string): Promise<void> {
    await this.hcfAmendmentRepo.update(
      { hcfAmendmentId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByHcf(hcfId: string): Promise<HcfAmendment[]> {
    const entities = await this.hcfAmendmentRepo.find({
      where: { hcfId, isDeleted: false },
      order: { amendmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(hcfAmendment: HcfAmendment): HcfAmendmentEntity {
    const entity = new HcfAmendmentEntity();
    entity.hcfAmendmentId = hcfAmendment.hcfAmendmentId;
    entity.hcfId = hcfAmendment.hcfId;
    entity.amendmentType = hcfAmendment.amendmentType;
    entity.amendmentDate = hcfAmendment.amendmentDate;
    entity.description = hcfAmendment.description;
    entity.amendmentStatus = hcfAmendment.amendmentStatus;
    entity.approvedBy = hcfAmendment.approvedBy;
    entity.approvedDate = hcfAmendment.approvedDate;
    entity.status = hcfAmendment.status;
    entity.createdBy = hcfAmendment.createdBy;
    entity.createdOn = hcfAmendment.createdOn;
    entity.modifiedBy = hcfAmendment.modifiedBy;
    entity.modifiedOn = hcfAmendment.modifiedOn;
    entity.isDeleted = hcfAmendment.isDeleted;
    return entity;
  }

  private toDomain(entity: HcfAmendmentEntity): HcfAmendment {
    return HcfAmendment.reconstitute({
      hcfAmendmentId: entity.hcfAmendmentId,
      hcfId: entity.hcfId,
      amendmentType: entity.amendmentType,
      amendmentDate: entity.amendmentDate,
      description: entity.description,
      amendmentStatus: entity.amendmentStatus,
      approvedBy: entity.approvedBy,
      approvedDate: entity.approvedDate,
      masterStatus: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
