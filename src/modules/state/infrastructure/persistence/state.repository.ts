import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IStateRepository } from '../../domain/interfaces/state.repository.interface';
import { State } from '../../domain/entities/state.domain.entity';
import { StateEntity } from './state.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class StateRepository implements IStateRepository {
  constructor(
    @InjectRepository(StateEntity, 'master')
    private readonly stateRepo: Repository<StateEntity>,
  ) {}

  async create(state: State): Promise<State> {
    const entity = this.toEntity(state);
    const saved = await this.stateRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(stateId: string): Promise<State | null> {
    const entity = await this.stateRepo.findOne({
      where: { stateId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<State[]> {
    const entities = await this.stateRepo.find({
      where: { isDeleted: false },
      order: { stateName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<State[]> {
    const entities = await this.stateRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { stateName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(stateId: string, state: State): Promise<State> {
    const entity = this.toEntity(state);
    await this.stateRepo.update({ stateId }, entity);
    const updated = await this.findById(stateId);
    if (!updated) {
      throw new Error(`State ${stateId} not found after update`);
    }
    return updated;
  }

  async softDelete(stateId: string): Promise<void> {
    await this.stateRepo.update(
      { stateId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByStateCode(stateCode: string): Promise<State | null> {
    const entity = await this.stateRepo.findOne({
      where: { stateCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStateName(stateName: string): Promise<State | null> {
    const entity = await this.stateRepo.findOne({
      where: { stateName, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(state: State): StateEntity {
    const entity = new StateEntity();
    entity.stateId = state.stateId;
    entity.stateCode = state.stateCode;
    entity.stateName = state.stateName;
    entity.status = state.status;
    entity.createdBy = state.createdBy;
    entity.createdOn = state.createdOn;
    entity.modifiedBy = state.modifiedBy;
    entity.modifiedOn = state.modifiedOn;
    entity.isDeleted = state.isDeleted;
    return entity;
  }

  private toDomain(entity: StateEntity): State {
    return State.reconstitute({
      stateId: entity.stateId,
      stateCode: entity.stateCode,
      stateName: entity.stateName,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
