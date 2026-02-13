import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateIncinerationRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  incinerationDate: string;

  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @IsString()
  @IsNotEmpty()
  secondaryChamberId: string;

  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @IsString()
  @IsNotEmpty()
  wasteCategory: string;

  @IsNumber()
  @Min(0)
  wasteQtyKg: number;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  @Min(0)
  avgTempC: number;

  @IsNumber()
  @Min(0)
  retentionTimeSec: number;

  @IsNumber()
  @Min(0)
  fuelUsedL: number;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
