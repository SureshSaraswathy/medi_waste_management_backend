import { IsString, IsNotEmpty, MaxLength, MinLength, Matches, IsOptional, IsEmail, IsUrl, ValidateIf, IsDateString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Company code must be uppercase alphanumeric' })
  companyCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  gstin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  pincode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  prefix?: string;

  // Address Information
  @IsString()
  @IsOptional()
  regdOfficeAddress?: string;

  @IsString()
  @IsOptional()
  adminOfficeAddress?: string;

  @IsString()
  @IsOptional()
  factoryAddress?: string;

  // Authorized Person Information
  @IsString()
  @IsOptional()
  @MaxLength(200)
  authPersonName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  authPersonDesignation?: string;

  @IsOptional()
  @IsDateString()
  authPersonDOB?: string;

  // PCB & Compliance
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pcbauthNum?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  hazardousWasteNum?: string;

  // CTO (Consent To Operate) - Water
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ctoWaterNum?: string;

  @IsOptional()
  @IsDateString()
  ctoWaterDate?: string;

  @IsOptional()
  @IsDateString()
  ctoWaterValidUpto?: string;

  // CTO (Consent To Operate) - Air
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ctoAirNum?: string;

  @IsOptional()
  @IsDateString()
  ctoAirDate?: string;

  @IsOptional()
  @IsDateString()
  ctoAirValidUpto?: string;

  // CTE (Consent To Establish) - Water
  @IsString()
  @IsOptional()
  @MaxLength(100)
  cteWaterNum?: string;

  @IsOptional()
  @IsDateString()
  cteWaterDate?: string;

  @IsOptional()
  @IsDateString()
  cteWaterValidUpto?: string;

  // CTE (Consent To Establish) - Air
  @IsString()
  @IsOptional()
  @MaxLength(100)
  cteAirNum?: string;

  @IsOptional()
  @IsDateString()
  cteAirDate?: string;

  @IsOptional()
  @IsDateString()
  cteAirValidUpto?: string;

  // GST Details
  @IsString()
  @IsOptional()
  @MaxLength(50)
  pcbZoneID?: string;

  @IsOptional()
  @IsDateString()
  gstValidFrom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gstRate?: string;

  // Contact Information
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.contactNum && o.contactNum.trim().length > 0)
  @MaxLength(15)
  @Matches(/^[0-9]+$/, { message: 'Contact number must contain only numbers' })
  contactNum?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.webAddress && o.webAddress.trim().length > 0)
  @MaxLength(500)
  @IsUrl({}, { message: 'Web address must be a valid URL' })
  webAddress?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.companyEmail && o.companyEmail.trim().length > 0)
  @MaxLength(255)
  @IsEmail({}, { message: 'Company email must be a valid email address' })
  companyEmail?: string;

  // Bank & Payment Information
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankAccountName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @ValidateIf((o) => {
    const hasAnyBankDetail = !!(o.bankAccountNum || o.bankIFSCode || o.bankBranch || o.bankAccountName || o.upiId || o.qrCode);
    return hasAnyBankDetail;
  })
  @IsNotEmpty({ message: 'Bank name is required when bank details are provided' })
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ValidateIf((o) => {
    const hasAnyBankDetail = !!(o.bankName || o.bankIFSCode || o.bankBranch || o.bankAccountName || o.upiId || o.qrCode);
    return hasAnyBankDetail;
  })
  @IsNotEmpty({ message: 'Bank account number is required when bank details are provided' })
  bankAccountNum?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.bankIFSCode && o.bankIFSCode.trim().length > 0)
  @MaxLength(11)
  @Matches(/^[A-Z]{4}0[A-Z0-9]{5,6}$/, { message: 'IFSC code must be in format: HDFC0001234 or ICIC000024 (4 letters + 0 + 5-6 alphanumeric)' })
  bankIFSCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankBranch?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.upiId && o.upiId.trim().length > 0)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, { message: 'UPI ID must be in format: name@bank (e.g., john@paytm, 9876543210@ybl)' })
  upiId?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;
}
