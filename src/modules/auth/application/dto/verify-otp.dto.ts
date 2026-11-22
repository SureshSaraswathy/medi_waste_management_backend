import { IsString, IsNotEmpty, Length, IsOptional, IsIn } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  usernameOrEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  /** Optional: 'mobile' when the mobile app signs in. Becomes a signed claim in the token. */
  @IsOptional()
  @IsIn(['mobile', 'desktop'])
  channel?: 'mobile' | 'desktop';
}
