import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsMobilePhone,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsUUID('4', { message: 'Company selection is invalid. Please select a valid company from the dropdown.' })
  @IsNotEmpty({ message: 'Company is required. Please select a company from the dropdown.' })
  companyId: string;

  @IsString()
  @IsNotEmpty({ message: 'User name is required. Please enter a user name.' })
  @MinLength(3, { message: 'User name must be at least 3 characters long. Example: johndoe, user123' })
  @MaxLength(100, { message: 'User name cannot exceed 100 characters. Please use a shorter user name.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'User name can only contain letters (a-z, A-Z), numbers (0-9), and underscores (_). Special characters and spaces are not allowed. Example: johndoe, user_123',
  })
  userName: string;

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required. Please enter a mobile number.' })
  @IsMobilePhone('en-IN', { strictMode: false }, { 
    message: 'Invalid mobile number format. Please enter a valid 10-digit Indian mobile number. Examples: 9876543210, +91-9876543210, 98765 43210' 
  })
  @MaxLength(20, { message: 'Mobile number cannot exceed 20 characters. Please check your input.' })
  mobileNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Employee code cannot exceed 50 characters. Please use a shorter employee code.' })
  employeeCode?: string;

  @IsUUID('4', { message: 'User role selection is invalid. Please select a valid role from the dropdown, or leave it empty if not assigning a role yet.' })
  @IsOptional()
  userRoleId?: string;
}
