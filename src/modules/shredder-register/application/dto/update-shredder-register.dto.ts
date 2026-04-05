import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min, ValidateIf } from 'class-validator';

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

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  wasteQtyKg?: number | null;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  temperatureC?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  pressureBar?: number | null;

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

  @IsString()
  @IsOptional()
  inputSourceType?: string;

  @IsString()
  @IsOptional()
  inputSourceRef?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  inputQtyKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  outputQtyKg?: number;

  @IsString()
  @IsOptional()
  bladeCondition?: string;

  @IsString()
  @IsOptional()
  outputDispatchedTo?: string;
}
