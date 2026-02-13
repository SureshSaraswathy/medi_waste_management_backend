import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateEmissionRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  emissionDate: string;

  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @IsString()
  @IsNotEmpty()
  stackId: string;

  @IsNumber()
  @Min(0)
  pm: number;

  @IsNumber()
  @Min(0)
  co: number;

  @IsNumber()
  @Min(0)
  hci: number;

  @IsNumber()
  temp: number;

  @IsNumber()
  @Min(0)
  oxygen: number;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
