import { IsUUID, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';

export class RouteAssignmentResponseDto {
  @IsUUID()
  id: string;

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
  status: RouteAssignmentStatus;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsUUID()
  @IsOptional()
  createdBy?: string | null;

  @IsDateString()
  createdOn: string;

  @IsUUID()
  @IsOptional()
  modifiedBy?: string | null;

  @IsDateString()
  modifiedOn: string;
}
