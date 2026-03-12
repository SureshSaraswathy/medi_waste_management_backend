import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['Bed', 'Kg', 'Lumpsum'])
  billingType?: 'Bed' | 'Kg' | 'Lumpsum';

  @IsOptional()
  @IsEnum(['Draft', 'Active', 'Expired'])
  status?: 'Draft' | 'Active' | 'Expired';

  @IsOptional()
  @IsUUID()
  agreementTemplateId?: string;
}
