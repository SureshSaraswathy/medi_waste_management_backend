import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateShredderRegisterDto {
  @IsDateString()
  @IsOptional()
  shredderDate?: string;

  @IsString()
  @IsOptional()
  equipmentId?: string;

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
  temperatureC?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pressureBar?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cycleTimeMin?: number;

  @IsString()
  @IsOptional()
  indicatorResult?: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
