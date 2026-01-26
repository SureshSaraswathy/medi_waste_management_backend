import { IsUUID, IsDateString, IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { CollectionStatus, WasteColor } from '../../infrastructure/transaction/waste-collection.entity';

export class CreateWasteCollectionDto {
  @IsString()
  barcode: string;

  @IsDateString()
  collectionDate: string;

  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

  @IsEnum(WasteColor)
  wasteColor: WasteColor;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number | null;

  @IsEnum(CollectionStatus)
  @IsOptional()
  status?: CollectionStatus;

  @IsUUID()
  @IsOptional()
  routeAssignmentId?: string | null;

  @IsUUID()
  @IsOptional()
  collectedBy?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
