import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignment } from '../../domain/entities/route-assignment.domain.entity';
import { RouteAssignmentEntity, RouteAssignmentStatus } from '../transaction/route-assignment.entity';

@Injectable()
export class RouteAssignmentRepository implements IRouteAssignmentRepository {
  constructor(
    @InjectRepository(RouteAssignmentEntity, 'transaction')
    private readonly routeAssignmentRepo: Repository<RouteAssignmentEntity>,
  ) {}

  async create(routeAssignment: RouteAssignment): Promise<RouteAssignment> {
    const entity = this.toEntity(routeAssignment);
    const saved = await this.routeAssignmentRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(routeAssignmentId: string): Promise<RouteAssignment | null> {
    const entity = await this.routeAssignmentRepo.findOne({
      where: { routeAssignmentId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<RouteAssignment[]> {
    const entities = await this.routeAssignmentRepo.find({
      where: { isDeleted: false },
      order: { assignmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<RouteAssignment[]> {
    const entities = await this.routeAssignmentRepo
      .createQueryBuilder('ra')
      .where('ra.assignment_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
      .andWhere('ra.assignment_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
      .andWhere('ra.is_deleted = false')
      .orderBy('ra.assignment_date', 'DESC')
      .addOrderBy('ra.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByDate(date: Date): Promise<RouteAssignment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entities = await this.routeAssignmentRepo
      .createQueryBuilder('ra')
      .where('ra.assignment_date = :date', { date: date.toISOString().split('T')[0] })
      .andWhere('ra.is_deleted = false')
      .orderBy('ra.created_on', 'DESC')
      .getMany();

    return entities.map((e) => this.toDomain(e));
  }

  async findByVehicleAndDate(vehicleId: string, date: Date): Promise<RouteAssignment | null> {
    const dateStr = date.toISOString().split('T')[0];
    const entity = await this.routeAssignmentRepo
      .createQueryBuilder('ra')
      .where('ra.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('ra.assignment_date = :date', { date: dateStr })
      .andWhere('ra.is_deleted = false')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByDriverAndDate(driverId: string, date: Date): Promise<RouteAssignment | null> {
    const dateStr = date.toISOString().split('T')[0];
    const entity = await this.routeAssignmentRepo
      .createQueryBuilder('ra')
      .where('ra.driver_id = :driverId', { driverId })
      .andWhere('ra.assignment_date = :date', { date: dateStr })
      .andWhere('ra.is_deleted = false')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByRouteAndDate(routeId: string, date: Date): Promise<RouteAssignment[]> {
    const dateStr = date.toISOString().split('T')[0];
    const entities = await this.routeAssignmentRepo
      .createQueryBuilder('ra')
      .where('ra.route_id = :routeId', { routeId })
      .andWhere('ra.assignment_date = :date', { date: dateStr })
      .andWhere('ra.is_deleted = false')
      .orderBy('ra.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string): Promise<RouteAssignment[]> {
    const entities = await this.routeAssignmentRepo.find({
      where: { companyId, isDeleted: false },
      order: { assignmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(status: string): Promise<RouteAssignment[]> {
    const entities = await this.routeAssignmentRepo.find({
      where: { status: status as RouteAssignmentStatus, isDeleted: false },
      order: { assignmentDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(routeAssignmentId: string, routeAssignment: RouteAssignment): Promise<RouteAssignment> {
    const entity = this.toEntity(routeAssignment);
    await this.routeAssignmentRepo.update({ routeAssignmentId }, entity);
    const updated = await this.findById(routeAssignmentId);
    if (!updated) {
      throw new Error(`RouteAssignment ${routeAssignmentId} not found after update`);
    }
    return updated;
  }

  async softDelete(routeAssignmentId: string): Promise<void> {
    await this.routeAssignmentRepo.update(
      { routeAssignmentId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(routeAssignment: RouteAssignment): RouteAssignmentEntity {
    const entity = new RouteAssignmentEntity();
    entity.routeAssignmentId = routeAssignment.routeAssignmentId;
    entity.assignmentDate = routeAssignment.assignmentDate;
    entity.routeId = routeAssignment.routeId;
    entity.vehicleId = routeAssignment.vehicleId;
    entity.driverId = routeAssignment.driverId;
    entity.pickerId = routeAssignment.pickerId;
    entity.supervisorId = routeAssignment.supervisorId;
    entity.companyId = routeAssignment.companyId;
    entity.status = routeAssignment.status;
    entity.notes = routeAssignment.notes;
    entity.createdBy = routeAssignment.createdBy;
    entity.createdOn = routeAssignment.createdOn;
    entity.modifiedBy = routeAssignment.modifiedBy;
    entity.modifiedOn = routeAssignment.modifiedOn;
    entity.isDeleted = routeAssignment.isDeleted;
    return entity;
  }

  private toDomain(entity: RouteAssignmentEntity): RouteAssignment {
    return RouteAssignment.reconstitute({
      routeAssignmentId: entity.routeAssignmentId,
      assignmentDate: entity.assignmentDate,
      routeId: entity.routeId,
      vehicleId: entity.vehicleId,
      driverId: entity.driverId,
      pickerId: entity.pickerId,
      supervisorId: entity.supervisorId,
      companyId: entity.companyId,
      status: entity.status,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
