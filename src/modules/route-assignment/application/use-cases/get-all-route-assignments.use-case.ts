import { Injectable, Inject } from '@nestjs/common';
import { IRouteAssignmentRepository, ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/route-assignment.repository.interface';
import { RouteAssignment } from '../../domain/entities/route-assignment.domain.entity';

@Injectable()
export class GetAllRouteAssignmentsUseCase {
  constructor(
    @Inject(ROUTE_ASSIGNMENT_REPOSITORY_TOKEN)
    private readonly routeAssignmentRepository: IRouteAssignmentRepository,
  ) {}

  async execute(
    companyId?: string,
    date?: string,
    status?: string,
  ): Promise<RouteAssignment[]> {
    if (date) {
      const assignmentDate = new Date(date);
      if (status) {
        const allByDate = await this.routeAssignmentRepository.findByDate(assignmentDate);
        return allByDate.filter((ra) => ra.status === status);
      }
      return this.routeAssignmentRepository.findByDate(assignmentDate);
    }

    if (companyId) {
      if (status) {
        const allByCompany = await this.routeAssignmentRepository.findByCompany(companyId);
        return allByCompany.filter((ra) => ra.status === status);
      }
      return this.routeAssignmentRepository.findByCompany(companyId);
    }

    if (status) {
      return this.routeAssignmentRepository.findByStatus(status);
    }

    return this.routeAssignmentRepository.findAll();
  }
}
