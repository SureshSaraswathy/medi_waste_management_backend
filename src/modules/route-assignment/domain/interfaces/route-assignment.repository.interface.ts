import { RouteAssignment } from '../entities/route-assignment.domain.entity';

export const ROUTE_ASSIGNMENT_REPOSITORY_TOKEN = 'ROUTE_ASSIGNMENT_REPOSITORY';

export interface IRouteAssignmentRepository {
  create(routeAssignment: RouteAssignment): Promise<RouteAssignment>;
  findById(routeAssignmentId: string): Promise<RouteAssignment | null>;
  findAll(): Promise<RouteAssignment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<RouteAssignment[]>;
  findByDate(date: Date): Promise<RouteAssignment[]>;
  findByVehicleAndDate(vehicleId: string, date: Date): Promise<RouteAssignment | null>;
  findByDriverAndDate(driverId: string, date: Date): Promise<RouteAssignment | null>;
  findByRouteAndDate(routeId: string, date: Date): Promise<RouteAssignment[]>;
  findByCompany(companyId: string): Promise<RouteAssignment[]>;
  findByStatus(status: string): Promise<RouteAssignment[]>;
  update(routeAssignmentId: string, routeAssignment: RouteAssignment): Promise<RouteAssignment>;
  softDelete(routeAssignmentId: string): Promise<void>;
}
