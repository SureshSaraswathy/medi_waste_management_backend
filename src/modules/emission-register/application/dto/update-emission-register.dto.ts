import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateEmissionRegisterDto {
  @IsDateString()
  @IsOptional()
  emissionDate?: string;

  @IsString()
  @IsOptional()
  equipmentId?: string;

  @IsString()
  @IsOptional()
  stackId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pm?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  co?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hci?: number;

  @IsNumber()
  @IsOptional()
  temp?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  oxygen?: number;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
