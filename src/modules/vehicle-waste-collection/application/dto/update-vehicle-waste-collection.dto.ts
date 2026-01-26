import {
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateVehicleWasteCollectionDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  grossWeightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tareWeightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  netWeightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  incinerationWeightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  autoclaveWeightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vehicleKm?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fuelUsageLiters?: number | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
