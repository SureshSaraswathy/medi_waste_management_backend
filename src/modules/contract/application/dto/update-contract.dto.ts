import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  contractNum?: string;

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
}
