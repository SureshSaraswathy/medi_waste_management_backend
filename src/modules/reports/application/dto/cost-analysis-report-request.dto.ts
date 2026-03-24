import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CostAnalysisReportRequestDto {
  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsIn(['All', 'Manpower Only', 'Fuel Only'])
  option?: 'All' | 'Manpower Only' | 'Fuel Only';

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

