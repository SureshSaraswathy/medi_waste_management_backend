import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

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
  temperatureC: number;

  @IsNumber()
  @Min(0)
  pressureBar: number;

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
}
