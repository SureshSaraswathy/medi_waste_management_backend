import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateDisposalRegisterDto {
  @IsDateString()
  @IsOptional()
  disposalDate?: string;

  @IsString()
  @IsOptional()
  sourceTreatmentType?: string;

  @IsString()
  @IsOptional()
  sourceBatchRef?: string;

  @IsString()
  @IsOptional()
  wasteType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityKg?: number;

  @IsString()
  @IsOptional()
  disposalMethod?: string;

  @IsString()
  @IsOptional()
  disposalSite?: string;

  @IsString()
  @IsOptional()
  transportMode?: string;

  @IsString()
  @IsOptional()
  vehicleNo?: string;

  @IsString()
  @IsOptional()
  manifestNo?: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
