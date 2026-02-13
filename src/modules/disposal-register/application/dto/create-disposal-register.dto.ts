import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateDisposalRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  disposalDate: string;

  @IsString()
  @IsNotEmpty()
  sourceTreatmentType: string;

  @IsString()
  @IsNotEmpty()
  sourceBatchRef: string;

  @IsString()
  @IsNotEmpty()
  wasteType: string;

  @IsNumber()
  @Min(0)
  quantityKg: number;

  @IsString()
  @IsNotEmpty()
  disposalMethod: string;

  @IsString()
  @IsNotEmpty()
  disposalSite: string;

  @IsString()
  @IsNotEmpty()
  transportMode: string;

  @IsString()
  @IsNotEmpty()
  vehicleNo: string;

  @IsString()
  @IsNotEmpty()
  manifestNo: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
