import { IsString, IsEnum } from 'class-validator';
import { BarcodeType } from '../../infrastructure/transaction/barcode-label.entity';

export class GetLastSequenceDto {
  @IsString()
  hcfCode: string;

  @IsEnum(BarcodeType)
  barcodeType: BarcodeType;
}
