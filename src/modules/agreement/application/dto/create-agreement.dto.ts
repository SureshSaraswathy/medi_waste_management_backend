import { IsString, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateAgreementDto {
  @IsUUID()
  contractId: string;

  @IsOptional()
  @IsString()
  agreementNum?: string;

  @IsDateString()
  agreementDate: string;

  @IsOptional()
  @IsEnum(['Draft', 'Generated', 'Signed'])
  status?: 'Draft' | 'Generated' | 'Signed';
}
