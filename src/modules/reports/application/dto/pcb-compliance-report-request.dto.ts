import { IsDateString, IsOptional } from 'class-validator';

export class PcbComplianceReportRequestDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

