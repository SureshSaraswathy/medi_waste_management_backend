import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for requesting HCF password reset (forgot password)
 */
export class RequestHCFPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: 'HCF Code or Email is required.' })
  identifier: string; // Can be hcfCode or contactEmail
}
