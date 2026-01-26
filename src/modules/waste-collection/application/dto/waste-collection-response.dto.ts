import { IsUUID, IsDateString, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { CollectionStatus, WasteColor } from '../../infrastructure/transaction/waste-collection.entity';

export class WasteCollectionResponseDto {
  @IsUUID()
  id: string;

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
  @IsOptional()
  weightKg?: number | null;

  @IsEnum(CollectionStatus)
  status: CollectionStatus;

  @IsUUID()
  @IsOptional()
  routeAssignmentId?: string | null;

  @IsUUID()
  @IsOptional()
  collectedBy?: string | null;

  @IsDateString()
  @IsOptional()
  collectedAt?: string | null;

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
  modifiedOn: string;
}
