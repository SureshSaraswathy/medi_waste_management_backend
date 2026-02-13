import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateDowntimeRegisterDto {
  @IsDateString()
  @IsOptional()
  breakdownDate?: string;

  @IsString()
  @IsOptional()
  equipmentId?: string;

  @IsString()
  @IsOptional()
  breakdownType?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  downtimeHours?: number;

  @IsString()
  @IsOptional()
  cause?: string;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsString()
  @IsOptional()
  sparesUsed?: string;

  @IsString()
  @IsOptional()
  complianceStatus?: string;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: 'Active' | 'Inactive';
}
