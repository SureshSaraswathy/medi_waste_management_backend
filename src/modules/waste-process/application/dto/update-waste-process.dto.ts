import {
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateWasteProcessDto {
  @IsNumber()
  @Min(0.01, { message: 'Incineration weight must be greater than zero' })
  @IsOptional()
  incinerationWeightKg?: number;

  @IsNumber()
  @Min(0.01, { message: 'Autoclave weight must be greater than zero' })
  @IsOptional()
  autoclaveWeightKg?: number;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
