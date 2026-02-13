import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateIncidentRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  incidentDate: string;

  @IsString()
  @IsNotEmpty()
  incidentTime: string;

  @IsString()
  @IsNotEmpty()
  incidentType: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  wasteCategory: string;

  @IsNumber()
  @Min(0)
  quantityValue: number;

  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsString()
  @IsOptional()
  personAffected?: string | null;

  @IsString()
  @IsOptional()
  immediateAction?: string | null;

  @IsString()
  @IsOptional()
  medicalAction?: string | null;

  @IsString()
  @IsOptional()
  reportedTo?: string | null;

  @IsString()
  @IsOptional()
  incidentStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
