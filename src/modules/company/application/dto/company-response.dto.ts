import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { CompanyStatus } from '../../domain/entities/company.domain.entity';

export class CompanyResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  companyCode: string;

  @IsString()
  companyName: string;

  @IsString()
  @IsOptional()
  gstin?: string | null;

  @IsString()
  @IsOptional()
  pincode?: string | null;

  @IsString()
  @IsOptional()
  state?: string | null;

  @IsString()
  @IsOptional()
  prefix?: string | null;

  // Address Information
  @IsString()
  @IsOptional()
  regdOfficeAddress?: string | null;

  @IsString()
  @IsOptional()
  adminOfficeAddress?: string | null;

  @IsString()
  @IsOptional()
  factoryAddress?: string | null;

  // Authorized Person Information
  @IsString()
  @IsOptional()
  authPersonName?: string | null;

  @IsString()
  @IsOptional()
  authPersonDesignation?: string | null;

  @IsString()
  @IsOptional()
  authPersonDOB?: string | null;

  // PCB & Compliance
  @IsString()
  @IsOptional()
  pcbauthNum?: string | null;

  @IsString()
  @IsOptional()
  hazardousWasteNum?: string | null;

  // CTO (Consent To Operate) - Water
  @IsString()
  @IsOptional()
  ctoWaterNum?: string | null;

  @IsString()
  @IsOptional()
  ctoWaterDate?: string | null;

  @IsString()
  @IsOptional()
  ctoWaterValidUpto?: string | null;

  // CTO (Consent To Operate) - Air
  @IsString()
  @IsOptional()
  ctoAirNum?: string | null;

  @IsString()
  @IsOptional()
  ctoAirDate?: string | null;

  @IsString()
  @IsOptional()
  ctoAirValidUpto?: string | null;

  // CTE (Consent To Establish) - Water
  @IsString()
  @IsOptional()
  cteWaterNum?: string | null;

  @IsString()
  @IsOptional()
  cteWaterDate?: string | null;

  @IsString()
  @IsOptional()
  cteWaterValidUpto?: string | null;

  // CTE (Consent To Establish) - Air
  @IsString()
  @IsOptional()
  cteAirNum?: string | null;

  @IsString()
  @IsOptional()
  cteAirDate?: string | null;

  @IsString()
  @IsOptional()
  cteAirValidUpto?: string | null;

  // GST Details
  @IsString()
  @IsOptional()
  pcbZoneID?: string | null;

  @IsString()
  @IsOptional()
  gstValidFrom?: string | null;

  @IsString()
  @IsOptional()
  gstRate?: string | null;

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
