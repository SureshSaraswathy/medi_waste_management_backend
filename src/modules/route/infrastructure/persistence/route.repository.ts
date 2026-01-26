import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { Route } from '../../domain/entities/route.domain.entity';
import { RouteEntity } from './route.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class RouteRepository implements IRouteRepository {
  constructor(
    @InjectRepository(RouteEntity, 'master')
    private readonly routeRepo: Repository<RouteEntity>,
  ) {}

  async create(route: Route): Promise<Route> {
    const entity = this.toEntity(route);
    const saved = await this.routeRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(routeId: string): Promise<Route | null> {
    const entity = await this.routeRepo.findOne({
      where: { routeId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Route[]> {
    const entities = await this.routeRepo.find({
      where: { isDeleted: false },
      order: { routeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Route[]> {
    const entities = await this.routeRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { routeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(routeId: string, route: Route): Promise<Route> {
    const entity = this.toEntity(route);
    await this.routeRepo.update({ routeId }, entity);
    const updated = await this.findById(routeId);
    if (!updated) {
      throw new Error(`Route ${routeId} not found after update`);
    }
    return updated;
  }

  async softDelete(routeId: string): Promise<void> {
    await this.routeRepo.update(
      { routeId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByRouteCode(routeCode: string, companyId: string): Promise<Route | null> {
    const entity = await this.routeRepo.findOne({
      where: { routeCode, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRouteName(routeName: string, companyId: string): Promise<Route | null> {
    const entity = await this.routeRepo.findOne({
      where: { routeName, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Route[]> {
    const entities = await this.routeRepo.find({
      where: { companyId, isDeleted: false },
      order: { routeName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(route: Route): RouteEntity {
    const entity = new RouteEntity();
    entity.routeId = route.routeId;
    entity.routeCode = route.routeCode;
    entity.routeName = route.routeName;
    entity.companyId = route.companyId;
    entity.frequencyId = route.frequencyId;
    entity.status = route.status;
    entity.createdBy = route.createdBy;
    entity.createdOn = route.createdOn;
    entity.modifiedBy = route.modifiedBy;
    entity.modifiedOn = route.modifiedOn;
    entity.isDeleted = route.isDeleted;
    return entity;
  }

  private toDomain(entity: RouteEntity): Route {
    return Route.reconstitute({
      routeId: entity.routeId,
      routeCode: entity.routeCode,
      routeName: entity.routeName,
      companyId: entity.companyId,
      frequencyId: entity.frequencyId,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
