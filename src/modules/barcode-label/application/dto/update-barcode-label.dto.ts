import { IsEnum, IsOptional } from 'class-validator';
import { ColorBlock, BarcodeStatus } from '../../infrastructure/transaction/barcode-label.entity';

export class UpdateBarcodeLabelDto {
  @IsOptional()
  @IsEnum(ColorBlock)
  colorBlock?: ColorBlock;

  @IsOptional()
  @IsEnum(BarcodeStatus)
  status?: BarcodeStatus;
}
