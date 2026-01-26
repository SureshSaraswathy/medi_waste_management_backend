import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFinBalanceDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
