import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for resetting HCF password with token
 */
export class ResetHCFPasswordWithTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required.' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters.' })
  newPassword: string;
}
