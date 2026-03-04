import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDistrictRepository } from '../../domain/interfaces/district.repository.interface';
import { District } from '../../domain/entities/district.domain.entity';
import { DistrictEntity } from './district.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class DistrictRepository implements IDistrictRepository {
  constructor(
    @InjectRepository(DistrictEntity, 'master')
    private readonly districtRepo: Repository<DistrictEntity>,
  ) {}

  async create(district: District): Promise<District> {
    const entity = this.toEntity(district);
    const saved = await this.districtRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(districtId: string): Promise<District | null> {
    const entity = await this.districtRepo.findOne({
      where: { districtId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<District[]> {
    const entities = await this.districtRepo.find({
      where: { isDeleted: false },
      order: { districtName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<District[]> {
    const entities = await this.districtRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { districtName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(districtId: string, district: District): Promise<District> {
    const entity = this.toEntity(district);
    await this.districtRepo.update({ districtId }, entity);
    const updated = await this.findById(districtId);
    if (!updated) {
      throw new Error(`District ${districtId} not found after update`);
    }
    return updated;
  }

  async softDelete(districtId: string): Promise<void> {
    await this.districtRepo.update(
      { districtId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByDistrictCode(districtCode: string): Promise<District | null> {
    const entity = await this.districtRepo.findOne({
      where: { districtCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByDistrictName(districtName: string): Promise<District | null> {
    const entity = await this.districtRepo.findOne({
      where: { districtName, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStateId(stateId: string): Promise<District[]> {
    const entities = await this.districtRepo.find({
      where: { stateId, isDeleted: false },
      order: { districtName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findActiveByStateId(stateId: string): Promise<District[]> {
    const entities = await this.districtRepo.find({
      where: { stateId, status: MasterStatus.ACTIVE, isDeleted: false },
      order: { districtName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(district: District): DistrictEntity {
    const entity = new DistrictEntity();
    entity.districtId = district.districtId;
    entity.districtCode = district.districtCode;
    entity.districtName = district.districtName;
    entity.stateId = district.stateId;
    entity.status = district.status;
    entity.createdBy = district.createdBy;
    entity.createdOn = district.createdOn;
    entity.modifiedBy = district.modifiedBy;
    entity.modifiedOn = district.modifiedOn;
    entity.isDeleted = district.isDeleted;
    return entity;
  }

  private toDomain(entity: DistrictEntity): District {
    return District.reconstitute({
      districtId: entity.districtId,
      districtCode: entity.districtCode,
      districtName: entity.districtName,
      stateId: entity.stateId,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
