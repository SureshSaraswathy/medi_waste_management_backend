import { IsUUID, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';

export class CreateRouteAssignmentDto {
  @IsDateString()
  assignmentDate: string;

  @IsUUID()
  routeId: string;

  @IsUUID()
  vehicleId: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  @IsOptional()
  pickerId?: string | null;

  @IsUUID()
  @IsOptional()
  supervisorId?: string | null;

  @IsUUID()
  companyId: string;

  @IsEnum(RouteAssignmentStatus)
  @IsOptional()
  status?: RouteAssignmentStatus;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
