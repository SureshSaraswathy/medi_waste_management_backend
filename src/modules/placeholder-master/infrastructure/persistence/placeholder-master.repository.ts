import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPlaceholderMasterRepository } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMaster } from '../../domain/entities/placeholder-master.domain.entity';
import { PlaceholderMasterEntity } from './placeholder-master.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class PlaceholderMasterRepository implements IPlaceholderMasterRepository {
  constructor(
    @InjectRepository(PlaceholderMasterEntity, 'master')
    private readonly placeholderRepo: Repository<PlaceholderMasterEntity>,
  ) {}

  async create(placeholder: PlaceholderMaster): Promise<PlaceholderMaster> {
    const entity = this.toEntity(placeholder);
    const saved = await this.placeholderRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(placeholderId: string): Promise<PlaceholderMaster | null> {
    const entity = await this.placeholderRepo.findOne({
      where: { placeholderId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<PlaceholderMaster[]> {
    const entities = await this.placeholderRepo.find({
      where: { isDeleted: false },
      order: { placeholderCode: 'ASC' },
    });
    return entities.map((p) => this.toDomain(p));
  }

  async findAllActive(): Promise<PlaceholderMaster[]> {
    const entities = await this.placeholderRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { placeholderCode: 'ASC' },
    });
    return entities.map((p) => this.toDomain(p));
  }

  async update(placeholderId: string, placeholder: PlaceholderMaster): Promise<PlaceholderMaster> {
    const entity = this.toEntity(placeholder);
    await this.placeholderRepo.update({ placeholderId }, entity);
    const updated = await this.findById(placeholderId);
    if (!updated) {
      throw new Error(`Placeholder ${placeholderId} not found after update`);
    }
    return updated;
  }

  async softDelete(placeholderId: string): Promise<void> {
    await this.placeholderRepo.update(
      { placeholderId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByPlaceholderCode(placeholderCode: string): Promise<PlaceholderMaster | null> {
    const entity = await this.placeholderRepo.findOne({
      where: { placeholderCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(placeholder: PlaceholderMaster): PlaceholderMasterEntity {
    const entity = new PlaceholderMasterEntity();
    entity.placeholderId = placeholder.placeholderId;
    entity.placeholderCode = placeholder.placeholderCode;
    entity.placeholderDescription = placeholder.placeholderDescription;
    entity.sourceTable = placeholder.sourceTable;
    entity.sourceColumn = placeholder.sourceColumn;
    entity.status = placeholder.status;
    entity.createdBy = placeholder.createdBy;
    entity.createdOn = placeholder.createdOn;
    entity.modifiedBy = placeholder.modifiedBy;
    entity.modifiedOn = placeholder.modifiedOn;
    entity.isDeleted = placeholder.isDeleted;
    return entity;
  }

  private toDomain(entity: PlaceholderMasterEntity): PlaceholderMaster {
    return PlaceholderMaster.reconstitute({
      placeholderId: entity.placeholderId,
      placeholderCode: entity.placeholderCode,
      placeholderDescription: entity.placeholderDescription,
      sourceTable: entity.sourceTable,
      sourceColumn: entity.sourceColumn,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
