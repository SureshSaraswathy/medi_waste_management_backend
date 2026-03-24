import { IsOptional, IsString } from 'class-validator';

export class HcfWasteCollectionHistoryRequestDto {
  @IsOptional()
  @IsString()
  hcfId?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
}

