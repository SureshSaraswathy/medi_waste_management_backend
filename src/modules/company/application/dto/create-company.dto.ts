import { IsString, IsNotEmpty, MaxLength, MinLength, Matches, IsOptional, IsEmail, IsUrl, ValidateIf } from 'class-validator';

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
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'IFSC code must be in format: HDFC0001234' })
  bankIFSCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankBranch?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.upiId && o.upiId.trim().length > 0)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: 'UPI ID must be in format: name@bank' })
  upiId?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;
}
