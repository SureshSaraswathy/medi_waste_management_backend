import { IsDateString, IsOptional, IsString } from 'class-validator';

export class OperatorPcbReportRequestDto {
  @IsOptional()
  @IsString()
  option?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

