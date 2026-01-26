import { IsDateString, IsEnum, IsNumber, IsOptional, IsInt, Min, ValidateIf, IsString } from 'class-validator';
import { BillingType, BillingOption } from '../../infrastructure/transaction/invoice.entity';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(BillingType)
  billingType?: BillingType;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingDays?: number;

  @IsOptional()
  @IsEnum(BillingOption)
  billingOption?: BillingOption;

  // Bed-wise fields
  @ValidateIf((o) => o.billingOption === BillingOption.BED_WISE)
  @IsOptional()
  @IsInt()
  @Min(0)
  bedCount?: number;

  @ValidateIf((o) => o.billingOption === BillingOption.BED_WISE)
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedRate?: number;

  // Weight-wise fields
  @ValidateIf((o) => o.billingOption === BillingOption.WEIGHT_WISE)
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightInKg?: number;

  @ValidateIf((o) => o.billingOption === BillingOption.WEIGHT_WISE)
  @IsOptional()
  @IsNumber()
  @Min(0)
  kgRate?: number;

  // Lumpsum field
  @ValidateIf((o) => o.billingOption === BillingOption.LUMPSUM)
  @IsOptional()
  @IsNumber()
  @Min(0)
  lumpsumAmount?: number;

  // Tax fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxableValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  igst?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cgst?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sgst?: number;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  invoiceValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
