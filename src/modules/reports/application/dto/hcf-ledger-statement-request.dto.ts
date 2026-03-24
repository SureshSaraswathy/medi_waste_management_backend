import { IsDateString, IsOptional, IsString } from 'class-validator';

export class HcfLedgerStatementRequestDto {
  @IsOptional()
  @IsString()
  hcfId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

