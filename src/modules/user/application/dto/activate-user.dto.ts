import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for activating a user.
 * Contains flags to enable password and/or OTP login.
 */
export class ActivateUserDto {
  @IsBoolean({ message: 'Password Enabled must be a boolean value' })
  @IsOptional()
  passwordEnabled?: boolean;

  @IsBoolean({ message: 'OTP Enabled must be a boolean value' })
  @IsOptional()
  otpEnabled?: boolean;

  @IsBoolean({ message: 'Force OTP on Next Login must be a boolean value' })
  @IsOptional()
  forceOtpOnNextLogin?: boolean;

  @IsBoolean({ message: 'Web Login must be a boolean value' })
  @IsOptional()
  webLogin?: boolean;

  @IsBoolean({ message: 'Mobile App Access must be a boolean value' })
  @IsOptional()
  mobileAppAccess?: boolean;
}
