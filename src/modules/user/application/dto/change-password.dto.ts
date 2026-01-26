import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for changing user password
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters.' })
  newPassword: string;
}
