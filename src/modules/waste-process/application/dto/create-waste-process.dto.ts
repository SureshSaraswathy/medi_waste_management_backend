import {
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWasteProcessDto {
  @IsUUID()
  companyId: string;

  @IsDateString()
  processDate: string;

  @IsNumber()
  @Min(0.01, { message: 'Incineration weight must be greater than zero' })
  incinerationWeightKg: number;

  @IsNumber()
  @Min(0.01, { message: 'Autoclave weight must be greater than zero' })
  autoclaveWeightKg: number;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
