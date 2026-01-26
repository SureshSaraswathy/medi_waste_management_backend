import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { Frequency } from '../../domain/entities/frequency.domain.entity';
import { FrequencyEntity } from './frequency.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class FrequencyRepository implements IFrequencyRepository {
  constructor(
    @InjectRepository(FrequencyEntity, 'master')
    private readonly frequencyRepo: Repository<FrequencyEntity>,
  ) {}

  async create(frequency: Frequency): Promise<Frequency> {
    const entity = this.toEntity(frequency);
    const saved = await this.frequencyRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(frequencyId: string): Promise<Frequency | null> {
    const entity = await this.frequencyRepo.findOne({
      where: { frequencyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Frequency[]> {
    const entities = await this.frequencyRepo.find({
      where: { isDeleted: false },
      order: { frequencyName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Frequency[]> {
    const entities = await this.frequencyRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { frequencyName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(frequencyId: string, frequency: Frequency): Promise<Frequency> {
    const entity = this.toEntity(frequency);
    await this.frequencyRepo.update({ frequencyId }, entity);
    const updated = await this.findById(frequencyId);
    if (!updated) {
      throw new Error(`Frequency ${frequencyId} not found after update`);
    }
    return updated;
  }

  async softDelete(frequencyId: string): Promise<void> {
    await this.frequencyRepo.update(
      { frequencyId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByFrequencyCode(frequencyCode: string, companyId: string): Promise<Frequency | null> {
    const entity = await this.frequencyRepo.findOne({
      where: { frequencyCode, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFrequencyName(frequencyName: string, companyId: string): Promise<Frequency | null> {
    const entity = await this.frequencyRepo.findOne({
      where: { frequencyName, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Frequency[]> {
    const entities = await this.frequencyRepo.find({
      where: { companyId, isDeleted: false },
      order: { frequencyName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(frequency: Frequency): FrequencyEntity {
    const entity = new FrequencyEntity();
    entity.frequencyId = frequency.frequencyId;
    entity.frequencyCode = frequency.frequencyCode;
    entity.frequencyName = frequency.frequencyName;
    entity.companyId = frequency.companyId;
    entity.status = frequency.status;
    entity.createdBy = frequency.createdBy;
    entity.createdOn = frequency.createdOn;
    entity.modifiedBy = frequency.modifiedBy;
    entity.modifiedOn = frequency.modifiedOn;
    entity.isDeleted = frequency.isDeleted;
    return entity;
  }

  private toDomain(entity: FrequencyEntity): Frequency {
    return Frequency.reconstitute({
      frequencyId: entity.frequencyId,
      frequencyCode: entity.frequencyCode,
      frequencyName: entity.frequencyName,
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
