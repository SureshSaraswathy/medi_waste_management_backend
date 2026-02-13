import { IsString, IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateETPRegisterDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(0)
  inflow: number;

  @IsNumber()
  @Min(0)
  treated: number;

  @IsNumber()
  ph: number;

  @IsNumber()
  @Min(0)
  bod: number;

  @IsNumber()
  @Min(0)
  cod: number;

  @IsNumber()
  @Min(0)
  tss: number;

  @IsNumber()
  @Min(0)
  oilGrease: number;

  @IsString()
  @IsNotEmpty()
  dischargeMode: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
