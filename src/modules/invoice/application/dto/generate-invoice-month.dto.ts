import { IsString, IsUUID, IsDateString, IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { BillingType } from '../../infrastructure/transaction/invoice.entity';

export enum InvoiceGenerationMode {
  BED_LUMPSUM = 'Bed/Lumpsum',
  WEIGHT_BASED = 'Weight Based',
}

export class GenerateInvoiceMonthDto {
  @IsUUID()
  companyId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number; // 1-12 (January = 1, December = 12)

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsDateString()
  invoiceDate: string; // User-entered invoice date

  @IsEnum(InvoiceGenerationMode)
  generationMode: InvoiceGenerationMode; // 'Bed/Lumpsum' or 'Weight Based'

  @IsOptional()
  @IsInt()
  @Min(1)
  dueDays?: number; // Defaults to 30 days from invoice date
}
