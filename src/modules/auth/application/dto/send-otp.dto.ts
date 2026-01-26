import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  usernameOrEmail: string;
}
