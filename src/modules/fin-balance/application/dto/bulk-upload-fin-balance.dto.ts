import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFinBalanceDto } from './create-fin-balance.dto';

export class BulkUploadFinBalanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinBalanceDto)
  records: CreateFinBalanceDto[];
}

export class BulkUploadPreviewDto {
  inserts: CreateFinBalanceDto[];
  updates: Array<{ finBalanceId: string; data: CreateFinBalanceDto }>;
  errors: Array<{ row: number; message: string; data: any }>;
}
