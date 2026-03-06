import { IsUUID, IsDateString, IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { BarcodeType, ColorBlock, BarcodeStatus } from '../../infrastructure/transaction/barcode-label.entity';

export class BarcodeLabelResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  hcfCode: string;

  @IsUUID()
  hcfId: string;

  @IsUUID()
  companyId: string;

  @IsInt()
  sequenceNumber: number;

  @IsString()
  barcodeValue: string;

  @IsEnum(BarcodeType)
  barcodeType: BarcodeType;

  @IsEnum(ColorBlock)
  colorBlock: ColorBlock;

  @IsEnum(BarcodeStatus)
  status: BarcodeStatus;

  @IsUUID()
  @IsOptional()
  createdBy?: string | null;

  @IsDateString()
  createdOn: string;
}
