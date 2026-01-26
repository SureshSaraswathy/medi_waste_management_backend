import { IsString, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateContractDto {
  @IsString()
  contractNum: string;

  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

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
