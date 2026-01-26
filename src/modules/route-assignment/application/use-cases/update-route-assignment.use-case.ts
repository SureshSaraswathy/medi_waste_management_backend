import { Injectable, Inject } from '@nestjs/common';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignment } from '../../domain/entities/route-assignment.domain.entity';
import { UpdateRouteAssignmentDto } from '../dto/update-route-assignment.dto';
import { RouteAssignmentNotFoundException, RouteAssignmentReadOnlyException, InvalidStatusTransitionException } from '../../domain/exceptions/route-assignment.exceptions';
import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';

@Injectable()
export class UpdateRouteAssignmentUseCase {
  constructor(
    @Inject(ROUTE_ASSIGNMENT_REPOSITORY_TOKEN)
    private readonly routeAssignmentRepository: IRouteAssignmentRepository,
  ) {}

  async execute(
    routeAssignmentId: string,
    updateRouteAssignmentDto: UpdateRouteAssignmentDto,
    modifiedBy?: string,
  ): Promise<RouteAssignment> {
    const routeAssignment = await this.routeAssignmentRepository.findById(routeAssignmentId);
    if (!routeAssignment) {
      throw new RouteAssignmentNotFoundException(routeAssignmentId);
    }

    // Check if assignment can be edited
    if (!routeAssignment.canEdit()) {
      throw new RouteAssignmentReadOnlyException(routeAssignment.status);
    }

    // Validate status transitions
    if (updateRouteAssignmentDto.status && updateRouteAssignmentDto.status !== routeAssignment.status) {
      this.validateStatusTransition(routeAssignment.status, updateRouteAssignmentDto.status);
    }

    routeAssignment.update({
      status: updateRouteAssignmentDto.status,
      pickerId: updateRouteAssignmentDto.pickerId,
      supervisorId: updateRouteAssignmentDto.supervisorId,
      notes: updateRouteAssignmentDto.notes,
      modifiedBy: modifiedBy || null,
    });

    return this.routeAssignmentRepository.update(routeAssignmentId, routeAssignment);
  }

  private validateStatusTransition(currentStatus: RouteAssignmentStatus, newStatus: RouteAssignmentStatus): void {
    const validTransitions: Record<RouteAssignmentStatus, RouteAssignmentStatus[]> = {
      [RouteAssignmentStatus.DRAFT]: [RouteAssignmentStatus.ASSIGNED],
      [RouteAssignmentStatus.ASSIGNED]: [RouteAssignmentStatus.IN_PROGRESS, RouteAssignmentStatus.DRAFT],
      [RouteAssignmentStatus.IN_PROGRESS]: [RouteAssignmentStatus.COMPLETED],
      [RouteAssignmentStatus.COMPLETED]: [], // Cannot transition from completed
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidStatusTransitionException(currentStatus, newStatus);
    }
  }
}
