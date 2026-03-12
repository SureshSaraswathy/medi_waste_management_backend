import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

  @IsUUID()
  agreementTemplateId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(['Bed', 'Kg', 'Lumpsum'])
  billingType: 'Bed' | 'Kg' | 'Lumpsum';

  @IsOptional()
  @IsEnum(['Draft', 'Active', 'Expired'])
  status?: 'Draft' | 'Active' | 'Expired';
}
