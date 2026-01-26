import { IsEnum, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { CollectionStatus } from '../../infrastructure/transaction/waste-collection.entity';

export class UpdateWasteCollectionDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number | null;

  @IsEnum(CollectionStatus)
  @IsOptional()
  status?: CollectionStatus;

  @IsUUID()
  @IsOptional()
  collectedBy?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
