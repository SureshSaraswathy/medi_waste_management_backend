import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for HCF login request
 */
export class HCFLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'HCF Code is required.' })
  hcfCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
