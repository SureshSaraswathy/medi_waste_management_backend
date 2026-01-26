import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsMobilePhone,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsNumber,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum EmploymentType {
  PERMANENT = 'Permanent',
  CONTRACT = 'Contract',
}

export enum UserStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

/**
 * Complete User Update DTO - All Steps Combined
 * Used when updating user data after completing all steps
 */
export class UpdateCompleteUserDto {
  // Step 1: Update User (Identity Only)
  @IsUUID('4', { message: 'Company selection is invalid. Please select a valid company from the dropdown.' })
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'User name must be at least 3 characters long. Example: johndoe, user123' })
  @MaxLength(100, { message: 'User name cannot exceed 100 characters. Please use a shorter user name.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'User name can only contain letters (a-z, A-Z), numbers (0-9), and underscores (_). Special characters and spaces are not allowed. Example: johndoe, user_123',
  })
  userName?: string;

  @IsString()
  @IsOptional()
  @IsMobilePhone('en-IN', { strictMode: false }, { 
    message: 'Invalid mobile number format. Please enter a valid 10-digit Indian mobile number. Examples: 9876543210, +91-9876543210, 98765 43210' 
  })
  @MaxLength(20, { message: 'Mobile number cannot exceed 20 characters. Please check your input.' })
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Employee code cannot exceed 50 characters. Please use a shorter employee code.' })
  employeeCode?: string;

  @IsUUID('4', { message: 'User role selection is invalid. Please select a valid role from the dropdown, or leave it empty if not assigning a role yet.' })
  @IsOptional()
  userRoleId?: string;

  @ValidateIf((o) => o.emailAddress !== null && o.emailAddress !== undefined && o.emailAddress !== '')
  @IsEmail({}, { message: 'Invalid email address format. Please enter a valid email address. Example: user@example.com' })
  @IsOptional()
  @MaxLength(255, { message: 'Email address cannot exceed 255 characters.' })
  emailAddress?: string | null;

  // Step 2: Employee Profile
  @IsEnum(EmploymentType, { message: 'Invalid employment type. Must be "Permanent" or "Contract".' })
  @IsOptional()
  employmentType?: EmploymentType;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Designation cannot exceed 100 characters.' })
  designation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Contractor name cannot exceed 200 characters.' })
  contractorName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Company name (third-party) cannot exceed 200 characters.' })
  companyNameThirdParty?: string;

  @IsNumber({}, { message: 'Gross salary must be a valid number.' })
  @IsOptional()
  grossSalary?: number;

  // Step 3: Identity & Compliance
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Aadhaar number cannot exceed 20 characters.' })
  aadhaarNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'PAN number cannot exceed 20 characters.' })
  panNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Driving license number cannot exceed 50 characters.' })
  drivingLicenseNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'PF number cannot exceed 50 characters.' })
  pfNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'UAN number cannot exceed 50 characters.' })
  uanNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'ESI number cannot exceed 50 characters.' })
  esiNumber?: string;

  // Step 4: Address & Emergency
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address cannot exceed 500 characters.' })
  addressLine?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Area cannot exceed 100 characters.' })
  area?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'City cannot exceed 100 characters.' })
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'District cannot exceed 100 characters.' })
  district?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Pincode cannot exceed 10 characters.' })
  pincode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Emergency contact cannot exceed 20 characters.' })
  emergencyContact?: string;

  // Step 5: User Activation
  @IsBoolean({ message: 'Web login must be a boolean value (true/false).' })
  @IsOptional()
  webLogin?: boolean;

  @IsBoolean({ message: 'Mobile app access must be a boolean value (true/false).' })
  @IsOptional()
  mobileAppAccess?: boolean;

  @IsEnum(UserStatus, { message: 'Status must be "Draft", "Active", or "Inactive".' })
  @IsOptional()
  status?: UserStatus;

  @IsBoolean({ message: 'Password enabled must be a boolean value (true/false).' })
  @IsOptional()
  passwordEnabled?: boolean;

  @IsBoolean({ message: 'OTP enabled must be a boolean value (true/false).' })
  @IsOptional()
  otpEnabled?: boolean;

  @IsBoolean({ message: 'Force OTP on next login must be a boolean value (true/false).' })
  @IsOptional()
  forceOtpOnNextLogin?: boolean;
}
