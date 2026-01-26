import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';

export class UpdateRouteAssignmentDto {
  @IsEnum(RouteAssignmentStatus)
  @IsOptional()
  status?: RouteAssignmentStatus;

  @IsUUID()
  @IsOptional()
  pickerId?: string | null;

  @IsUUID()
  @IsOptional()
  supervisorId?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
