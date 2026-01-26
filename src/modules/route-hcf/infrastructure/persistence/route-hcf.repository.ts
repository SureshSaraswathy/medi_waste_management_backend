import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcf } from '../../domain/entities/route-hcf.domain.entity';
import { RouteHcfEntity } from './route-hcf.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class RouteHcfRepository implements IRouteHcfRepository {
  constructor(
    @InjectRepository(RouteHcfEntity, 'master')
    private readonly routeHcfRepo: Repository<RouteHcfEntity>,
  ) {}

  async create(routeHcf: RouteHcf): Promise<RouteHcf> {
    const entity = this.toEntity(routeHcf);
    const saved = await this.routeHcfRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(routeHcfId: string): Promise<RouteHcf | null> {
    const entity = await this.routeHcfRepo.findOne({
      where: { routeHcfId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<RouteHcf[]> {
    const entities = await this.routeHcfRepo.find({
      where: { isDeleted: false },
      order: { sequenceOrder: 'ASC', createdOn: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<RouteHcf[]> {
    const entities = await this.routeHcfRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { sequenceOrder: 'ASC', createdOn: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(routeHcfId: string, routeHcf: RouteHcf): Promise<RouteHcf> {
    const entity = this.toEntity(routeHcf);
    await this.routeHcfRepo.update({ routeHcfId }, entity);
    const updated = await this.findById(routeHcfId);
    if (!updated) {
      throw new Error(`RouteHcf ${routeHcfId} not found after update`);
    }
    return updated;
  }

  async softDelete(routeHcfId: string): Promise<void> {
    await this.routeHcfRepo.update(
      { routeHcfId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByRouteAndHcf(routeId: string, hcfId: string): Promise<RouteHcf | null> {
    const entity = await this.routeHcfRepo.findOne({
      where: { routeId, hcfId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRoute(routeId: string): Promise<RouteHcf[]> {
    const entities = await this.routeHcfRepo.find({
      where: { routeId, isDeleted: false },
      order: { sequenceOrder: 'ASC', createdOn: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcf(hcfId: string): Promise<RouteHcf[]> {
    const entities = await this.routeHcfRepo.find({
      where: { hcfId, isDeleted: false },
      order: { sequenceOrder: 'ASC', createdOn: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string): Promise<RouteHcf[]> {
    const entities = await this.routeHcfRepo.find({
      where: { companyId, isDeleted: false },
      order: { sequenceOrder: 'ASC', createdOn: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(routeHcf: RouteHcf): RouteHcfEntity {
    const entity = new RouteHcfEntity();
    entity.routeHcfId = routeHcf.routeHcfId;
    entity.routeId = routeHcf.routeId;
    entity.hcfId = routeHcf.hcfId;
    entity.companyId = routeHcf.companyId;
    entity.sequenceOrder = routeHcf.sequenceOrder;
    entity.status = routeHcf.status;
    entity.createdBy = routeHcf.createdBy;
    entity.createdOn = routeHcf.createdOn;
    entity.modifiedBy = routeHcf.modifiedBy;
    entity.modifiedOn = routeHcf.modifiedOn;
    entity.isDeleted = routeHcf.isDeleted;
    return entity;
  }

  private toDomain(entity: RouteHcfEntity): RouteHcf {
    return RouteHcf.reconstitute({
      routeHcfId: entity.routeHcfId,
      routeId: entity.routeId,
      hcfId: entity.hcfId,
      companyId: entity.companyId,
      sequenceOrder: entity.sequenceOrder,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
