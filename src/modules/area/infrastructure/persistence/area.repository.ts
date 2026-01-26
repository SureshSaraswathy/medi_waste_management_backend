import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAreaRepository } from '../../domain/interfaces/area.repository.interface';
import { Area } from '../../domain/entities/area.domain.entity';
import { AreaEntity } from './area.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class AreaRepository implements IAreaRepository {
  constructor(
    @InjectRepository(AreaEntity, 'master')
    private readonly areaRepo: Repository<AreaEntity>,
  ) {}

  async create(area: Area): Promise<Area> {
    const entity = this.toEntity(area);
    const saved = await this.areaRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(areaId: string): Promise<Area | null> {
    const entity = await this.areaRepo.findOne({
      where: { areaId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Area[]> {
    const entities = await this.areaRepo.find({
      where: { isDeleted: false },
      order: { areaName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Area[]> {
    const entities = await this.areaRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { areaName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(areaId: string, area: Area): Promise<Area> {
    const entity = this.toEntity(area);
    await this.areaRepo.update({ areaId }, entity);
    const updated = await this.findById(areaId);
    if (!updated) {
      throw new Error(`Area ${areaId} not found after update`);
    }
    return updated;
  }

  async softDelete(areaId: string): Promise<void> {
    await this.areaRepo.update(
      { areaId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByAreaCode(areaCode: string): Promise<Area | null> {
    const entity = await this.areaRepo.findOne({
      where: { areaCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAreaName(areaName: string): Promise<Area | null> {
    const entity = await this.areaRepo.findOne({
      where: { areaName, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(area: Area): AreaEntity {
    const entity = new AreaEntity();
    entity.areaId = area.areaId;
    entity.areaCode = area.areaCode;
    entity.areaName = area.areaName;
    entity.areaPincode = area.areaPincode;
    entity.status = area.status;
    entity.createdBy = area.createdBy;
    entity.createdOn = area.createdOn;
    entity.modifiedBy = area.modifiedBy;
    entity.modifiedOn = area.modifiedOn;
    entity.isDeleted = area.isDeleted;
    return entity;
  }

  private toDomain(entity: AreaEntity): Area {
    return Area.reconstitute({
      areaId: entity.areaId,
      areaCode: entity.areaCode,
      areaName: entity.areaName,
      areaPincode: entity.areaPincode,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
