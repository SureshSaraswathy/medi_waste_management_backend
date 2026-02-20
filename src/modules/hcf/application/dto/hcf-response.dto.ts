import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class HcfResponseDto extends BaseMasterResponseDto {
  @IsString()
  hcfCode: string;

  @IsUUID()
  companyId: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  hcfTypeCode?: string;

  @IsString()
  hcfName: string;

  @IsString()
  @IsOptional()
  hcfShortName?: string;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  stateCode?: string;

  @IsString()
  @IsOptional()
  groupCode?: string;

  @IsUUID()
  @IsOptional()
  pcbZone?: string;

  @IsString()
  @IsOptional()
  billingName?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  serviceAddress?: string;

  @IsString()
  @IsOptional()
  gstin?: string;

  @IsString()
  @IsOptional()
  regnNum?: string;

  @IsString()
  @IsOptional()
  hospRegnDate?: string;

  @IsString()
  @IsOptional()
  billingType?: string;

  @IsString()
  @IsOptional()
  advAmount?: string;

  @IsString()
  @IsOptional()
  billingOption?: string;

  @IsString()
  @IsOptional()
  bedCount?: string;

  @IsString()
  @IsOptional()
  bedRate?: string;

  @IsString()
  @IsOptional()
  kgRate?: string;

  @IsString()
  @IsOptional()
  lumpsum?: string;

  @IsString()
  @IsOptional()
  accountsLandline?: string;

  @IsString()
  @IsOptional()
  accountsMobile?: string;

  @IsString()
  @IsOptional()
  accountsEmail?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactDesignation?: string;

  @IsString()
  @IsOptional()
  contactMobile?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  agrSignAuthName?: string;

  @IsString()
  @IsOptional()
  agrSignAuthDesignation?: string;

  @IsString()
  @IsOptional()
  drName?: string;

  @IsString()
  @IsOptional()
  drPhNo?: string;

  @IsString()
  @IsOptional()
  drEmail?: string;

  @IsString()
  @IsOptional()
  serviceStartDate?: string;

  @IsString()
  @IsOptional()
  serviceEndDate?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  route?: string;

  @IsString()
  @IsOptional()
  executive_Assigned?: string;

  @IsString()
  @IsOptional()
  submitBy?: string;

  @IsString()
  @IsOptional()
  agrID?: string;

  @IsString()
  @IsOptional()
  sortOrder?: string;

  @IsBoolean()
  @IsOptional()
  isGovt?: boolean;

  @IsBoolean()
  @IsOptional()
  isGSTExempt?: boolean;

  @IsBoolean()
  @IsOptional()
  autoGen?: boolean;

  @IsBoolean()
  @IsOptional()
  loginEnabled?: boolean;
}
