import {
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVehicleWasteCollectionDto {
  @IsUUID()
  vehicleId: string;

  @IsDateString()
  collectionDate: string;

  @IsNumber()
  @Min(0)
  grossWeightKg: number;

  @IsNumber()
  @Min(0)
  tareWeightKg: number;

  @IsNumber()
  @Min(0)
  netWeightKg: number;

  @IsNumber()
  @Min(0)
  incinerationWeightKg: number;

  @IsNumber()
  @Min(0)
  autoclaveWeightKg: number;

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
