import { IsString, IsNotEmpty, IsUUID, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateHcfDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  hcfCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  hcfTypeCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  hcfName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  hcfShortName?: string;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  pincode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  stateCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  groupCode?: string;

  @IsUUID()
  @IsOptional()
  pcbZone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  billingName?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  serviceAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gstin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  regnNum?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  hospRegnDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  billingType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  advAmount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  billingOption?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  bedCount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  bedRate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  kgRate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  lumpsum?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  accountsLandline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  accountsMobile?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  accountsEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactDesignation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactMobile?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  agrSignAuthName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  agrSignAuthDesignation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  drName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  drPhNo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  drEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  serviceStartDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  serviceEndDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  route?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  executive_Assigned?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  submitBy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  agrID?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
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
}
