import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFinBalanceDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentBalance?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
