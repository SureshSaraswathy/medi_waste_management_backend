import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateETPRegisterDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  inflow?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  treated?: number;

  @IsNumber()
  @IsOptional()
  ph?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bod?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cod?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tss?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  oilGrease?: number;

  @IsString()
  @IsOptional()
  dischargeMode?: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
