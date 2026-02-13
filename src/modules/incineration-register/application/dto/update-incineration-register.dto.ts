import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateIncinerationRegisterDto {
  @IsDateString()
  @IsOptional()
  incinerationDate?: string;

  @IsString()
  @IsOptional()
  equipmentId?: string;

  @IsString()
  @IsOptional()
  secondaryChamberId?: string;

  @IsString()
  @IsOptional()
  batchNo?: string;

  @IsString()
  @IsOptional()
  wasteCategory?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  wasteQtyKg?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgTempC?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  retentionTimeSec?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fuelUsedL?: number;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
