import { IsOptional, IsString } from 'class-validator';

export class MissedRouteScheduleRequestDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  area?: string;
}

