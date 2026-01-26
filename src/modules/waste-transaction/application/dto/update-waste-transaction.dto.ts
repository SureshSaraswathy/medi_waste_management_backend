import {
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  ValidateIf,
} from 'class-validator';
import { SegregationQuality } from '../../infrastructure/transaction/waste-transaction.entity';

export class UpdateWasteTransactionDto {
  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @IsBoolean()
  @IsOptional()
  isNilPickup?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  yellowBagCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  redBagCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  whiteBagCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  blueBagCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => !o.isNilPickup)
  yellowWeightKg?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => !o.isNilPickup)
  redWeightKg?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => !o.isNilPickup)
  whiteWeightKg?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => !o.isNilPickup)
  blueWeightKg?: number | null;

  @IsNumber()
  @IsOptional()
  latitude?: number | null;

  @IsNumber()
  @IsOptional()
  longitude?: number | null;

  @IsEnum(SegregationQuality)
  @IsOptional()
  @ValidateIf((o) => !o.isNilPickup)
  segregationQuality?: SegregationQuality | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
