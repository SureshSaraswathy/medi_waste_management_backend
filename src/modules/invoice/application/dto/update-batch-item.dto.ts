import { IsOptional, IsNumber, IsBoolean, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBatchItemDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxPercent?: number;

  @IsBoolean()
  @IsOptional()
  isSelected?: boolean;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
