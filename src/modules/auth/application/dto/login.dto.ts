import { IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  usernameOrEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password: string;

  /** Optional: 'mobile' when the mobile app signs in. Becomes a signed claim in the token. */
  @IsOptional()
  @IsIn(['mobile', 'desktop'])
  channel?: 'mobile' | 'desktop';
}
