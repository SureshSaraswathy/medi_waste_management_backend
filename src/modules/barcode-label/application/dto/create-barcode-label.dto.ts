import { IsUUID, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { BarcodeType, ColorBlock } from '../../infrastructure/transaction/barcode-label.entity';

export class CreateBarcodeLabelDto {
  @IsUUID()
  hcfId: string;

  @IsUUID()
  companyId: string;

  @IsEnum(BarcodeType)
  barcodeType: BarcodeType;

  @IsEnum(ColorBlock)
  colorBlock: ColorBlock;

  @IsInt()
  @Min(1)
  @Max(1000)
  count: number;
}
