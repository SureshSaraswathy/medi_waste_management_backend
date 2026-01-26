import { Injectable, Inject } from '@nestjs/common';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignment } from '../../domain/entities/route-assignment.domain.entity';
import { CreateRouteAssignmentDto } from '../dto/create-route-assignment.dto';
import { DuplicateVehicleAssignmentException, DuplicateDriverAssignmentException } from '../../domain/exceptions/route-assignment.exceptions';
import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateRouteAssignmentUseCase {
  constructor(
    @Inject(ROUTE_ASSIGNMENT_REPOSITORY_TOKEN)
    private readonly routeAssignmentRepository: IRouteAssignmentRepository,
  ) {}

  async execute(createRouteAssignmentDto: CreateRouteAssignmentDto, createdBy?: string): Promise<RouteAssignment> {
    const assignmentDate = new Date(createRouteAssignmentDto.assignmentDate);

    // Check for duplicate vehicle assignment on the same date
    const existingVehicleAssignment = await this.routeAssignmentRepository.findByVehicleAndDate(
      createRouteAssignmentDto.vehicleId,
      assignmentDate,
    );
    if (existingVehicleAssignment) {
      throw new DuplicateVehicleAssignmentException(
        createRouteAssignmentDto.vehicleId,
        createRouteAssignmentDto.assignmentDate,
      );
    }

    // Check for duplicate driver assignment on the same date
    const existingDriverAssignment = await this.routeAssignmentRepository.findByDriverAndDate(
      createRouteAssignmentDto.driverId,
      assignmentDate,
    );
    if (existingDriverAssignment) {
      throw new DuplicateDriverAssignmentException(
        createRouteAssignmentDto.driverId,
        createRouteAssignmentDto.assignmentDate,
      );
    }

    const routeAssignment = RouteAssignment.create({
      routeAssignmentId: randomUUID(),
      assignmentDate,
      routeId: createRouteAssignmentDto.routeId,
      vehicleId: createRouteAssignmentDto.vehicleId,
      driverId: createRouteAssignmentDto.driverId,
      pickerId: createRouteAssignmentDto.pickerId,
      supervisorId: createRouteAssignmentDto.supervisorId,
      companyId: createRouteAssignmentDto.companyId,
      notes: createRouteAssignmentDto.notes,
      status: createRouteAssignmentDto.status || RouteAssignmentStatus.DRAFT,
      createdBy: createdBy || null,
    });

    return this.routeAssignmentRepository.create(routeAssignment);
  }
}
