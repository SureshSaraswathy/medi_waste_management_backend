import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateIncidentRegisterDto {
  @IsDateString()
  @IsOptional()
  incidentDate?: string;

  @IsString()
  @IsOptional()
  incidentTime?: string;

  @IsString()
  @IsOptional()
  incidentType?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  wasteCategory?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityValue?: number;

  @IsString()
  @IsOptional()
  quantityUnit?: string;

  @IsString()
  @IsOptional()
  severity?: string;

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
