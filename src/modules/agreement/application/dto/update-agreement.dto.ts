import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateAgreementDto {
  @IsOptional()
  @IsString()
  agreementNum?: string;

  @IsOptional()
  @IsDateString()
  agreementDate?: string;

  @IsOptional()
  @IsEnum(['Draft', 'Generated', 'Signed'])
  status?: 'Draft' | 'Generated' | 'Signed';
}
