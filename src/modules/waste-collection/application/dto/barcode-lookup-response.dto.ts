import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { WasteColor } from '../../infrastructure/transaction/waste-collection.entity';

export class BarcodeLookupResponseDto {
  @IsString()
  barcode: string;

  @IsUUID()
  companyId: string;

  @IsString()
  companyName: string;

  @IsUUID()
  hcfId: string;

  @IsString()
  hcfCode: string;

  @IsString()
  hcfName: string;

  @IsEnum(WasteColor)
  wasteColor: WasteColor;

  @IsString()
  @IsOptional()
  sequenceNumber?: string;
}
