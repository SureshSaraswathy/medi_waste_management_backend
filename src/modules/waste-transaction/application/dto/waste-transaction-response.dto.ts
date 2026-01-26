import { IsUUID, IsDateString, IsBoolean, IsInt, IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { TransactionStatus, SegregationQuality } from '../../infrastructure/transaction/waste-transaction.entity';

export class WasteTransactionResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

  @IsDateString()
  pickupDate: string;

  @IsBoolean()
  isNilPickup: boolean;

  @IsInt()
  yellowBagCount: number;

  @IsInt()
  redBagCount: number;

  @IsInt()
  whiteBagCount: number;

  @IsInt()
  blueBagCount: number;

  @IsNumber()
  @IsOptional()
  yellowWeightKg?: number | null;

  @IsNumber()
  @IsOptional()
  redWeightKg?: number | null;

  @IsNumber()
  @IsOptional()
  whiteWeightKg?: number | null;

  @IsNumber()
  @IsOptional()
  blueWeightKg?: number | null;

  @IsNumber()
  @IsOptional()
  latitude?: number | null;

  @IsNumber()
  @IsOptional()
  longitude?: number | null;

  @IsEnum(SegregationQuality)
  @IsOptional()
  segregationQuality?: SegregationQuality | null;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

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
