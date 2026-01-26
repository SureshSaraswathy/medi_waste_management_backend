import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for activating user with temporary password generation
 */
export class ActivateUserWithPasswordDto {
  @IsBoolean({ message: 'Password enabled must be a boolean value (true/false).' })
  @IsOptional()
  passwordEnabled?: boolean;

  @IsBoolean({ message: 'OTP enabled must be a boolean value (true/false).' })
  @IsOptional()
  otpEnabled?: boolean;

  @IsBoolean({ message: 'Web login must be a boolean value (true/false).' })
  @IsOptional()
  webLogin?: boolean;

  @IsBoolean({ message: 'Mobile app access must be a boolean value (true/false).' })
  @IsOptional()
  mobileAppAccess?: boolean;

  @IsBoolean({ message: 'Force OTP on next login must be a boolean value (true/false).' })
  @IsOptional()
  forceOtpOnNextLogin?: boolean;
}
