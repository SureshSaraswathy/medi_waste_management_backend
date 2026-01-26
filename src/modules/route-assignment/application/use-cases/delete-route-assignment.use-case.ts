import { Injectable, Inject } from '@nestjs/common';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignmentNotFoundException, RouteAssignmentReadOnlyException } from '../../domain/exceptions/route-assignment.exceptions';

@Injectable()
export class DeleteRouteAssignmentUseCase {
  constructor(
    @Inject(ROUTE_ASSIGNMENT_REPOSITORY_TOKEN)
    private readonly routeAssignmentRepository: IRouteAssignmentRepository,
  ) {}

  async execute(routeAssignmentId: string, modifiedBy?: string): Promise<void> {
    const routeAssignment = await this.routeAssignmentRepository.findById(routeAssignmentId);
    if (!routeAssignment) {
      throw new RouteAssignmentNotFoundException(routeAssignmentId);
    }

    // Only allow deletion of Draft and Assigned assignments
    if (!routeAssignment.canEdit()) {
      throw new RouteAssignmentReadOnlyException(routeAssignment.status);
    }

    await this.routeAssignmentRepository.softDelete(routeAssignmentId);
  }
}
