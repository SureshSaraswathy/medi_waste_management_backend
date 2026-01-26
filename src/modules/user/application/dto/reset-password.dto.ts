import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * DTO for requesting password reset (forgot password)
 */
export class RequestPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: 'Email or mobile number is required.' })
  identifier: string; // Can be email or mobile number
}

/**
 * DTO for resetting password with token
 */
export class ResetPasswordWithTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required.' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters.' })
  newPassword: string;
}
