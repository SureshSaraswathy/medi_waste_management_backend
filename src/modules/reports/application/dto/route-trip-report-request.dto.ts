import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RouteTripReportRequestDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
