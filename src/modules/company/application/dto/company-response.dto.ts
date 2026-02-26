import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { CompanyStatus } from '../../domain/entities/company.domain.entity';

export class CompanyResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  companyCode: string;

  @IsString()
  companyName: string;

  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @IsString()
  @IsOptional()
  createdBy?: string | null;

  createdOn: string;

  @IsString()
  @IsOptional()
  modifiedBy?: string | null;

  modifiedOn: string;

  // Contact Information
  @IsString()
  @IsOptional()
  contactNum?: string | null;

  @IsString()
  @IsOptional()
  webAddress?: string | null;

  @IsString()
  @IsOptional()
  companyEmail?: string | null;

  // Bank & Payment Information
  @IsString()
  @IsOptional()
  bankAccountName?: string | null;

  @IsString()
  @IsOptional()
  bankName?: string | null;

  @IsString()
  @IsOptional()
  bankAccountNum?: string | null;

  @IsString()
  @IsOptional()
  bankIFSCode?: string | null;

  @IsString()
  @IsOptional()
  bankBranch?: string | null;

  @IsString()
  @IsOptional()
  upiId?: string | null;

  @IsString()
  @IsOptional()
  qrCode?: string | null;
}
