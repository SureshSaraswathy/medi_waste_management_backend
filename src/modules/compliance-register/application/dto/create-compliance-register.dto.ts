import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateComplianceRegisterDto {
  @IsString()
  @IsNotEmpty()
  complianceName: string;

  @IsString()
  @IsNotEmpty()
  complianceType: string;

  @IsString()
  @IsNotEmpty()
  authority: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string | null;

  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

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
