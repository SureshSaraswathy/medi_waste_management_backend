import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateComplianceRegisterDto {
  @IsString()
  @IsOptional()
  complianceName?: string;

  @IsString()
  @IsOptional()
  complianceType?: string;

  @IsString()
  @IsOptional()
  authority?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string | null;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string | null;

  @IsNumber()
  @Min(1)
  @IsOptional()
  reminderDays?: number | null;

  @IsEnum(['Active', 'Expiring Soon', 'Expired', 'Draft'])
  @IsOptional()
  status?: 'Active' | 'Expiring Soon' | 'Expired' | 'Draft';

  @IsString()
  @IsOptional()
  documentUrl?: string | null;

  @IsString()
  @IsOptional()
  remarks?: string | null;
}
