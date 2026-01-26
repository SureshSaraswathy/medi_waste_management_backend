import { Injectable, Inject } from '@nestjs/common';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignment } from '../../domain/entities/route-assignment.domain.entity';
import { RouteAssignmentNotFoundException } from '../../domain/exceptions/route-assignment.exceptions';

@Injectable()
export class GetRouteAssignmentUseCase {
  constructor(
    @Inject(ROUTE_ASSIGNMENT_REPOSITORY_TOKEN)
    private readonly routeAssignmentRepository: IRouteAssignmentRepository,
  ) {}

  async execute(routeAssignmentId: string): Promise<RouteAssignment> {
    const routeAssignment = await this.routeAssignmentRepository.findById(routeAssignmentId);
    if (!routeAssignment) {
      throw new RouteAssignmentNotFoundException(routeAssignmentId);
    }
    return routeAssignment;
  }
}
