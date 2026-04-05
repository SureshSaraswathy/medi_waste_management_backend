import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min, ValidateIf } from 'class-validator';

export class CreateShredderRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  shredderDate: string;

  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @IsString()
  @IsNotEmpty()
  wasteCategory: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  wasteQtyKg?: number | null;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

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
  cycleTimeMin: number;

  @IsString()
  @IsNotEmpty()
  indicatorResult: string;

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
