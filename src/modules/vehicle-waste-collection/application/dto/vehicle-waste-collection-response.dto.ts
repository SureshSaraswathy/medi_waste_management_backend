import { IsUUID, IsDateString, IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { VehicleWasteCollectionStatus } from '../../infrastructure/transaction/vehicle-waste-collection.entity';

export class VehicleWasteCollectionResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  vehicleId: string;

  @IsDateString()
  collectionDate: string;

  @IsNumber()
  grossWeightKg: number;

  @IsNumber()
  tareWeightKg: number;

  @IsNumber()
  netWeightKg: number;

  @IsNumber()
  incinerationWeightKg: number;

  @IsNumber()
  autoclaveWeightKg: number;

  @IsNumber()
  @IsOptional()
  vehicleKm?: number | null;

  @IsNumber()
  @IsOptional()
  fuelUsageLiters?: number | null;

  @IsEnum(VehicleWasteCollectionStatus)
  status: VehicleWasteCollectionStatus;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsUUID()
  @IsOptional()
  createdBy?: string | null;

  @IsDateString()
  createdOn: string;

  @IsUUID()
  @IsOptional()
  modifiedBy?: string | null;

  @IsDateString()
  @IsOptional()
  modifiedOn?: string | null;

  @IsUUID()
  @IsOptional()
  verifiedBy?: string | null;

  @IsDateString()
  @IsOptional()
  verifiedOn?: string | null;
}
