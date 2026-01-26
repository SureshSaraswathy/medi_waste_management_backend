import { IsString, IsUUID, IsDateString, IsEnum, IsNumber, IsOptional, IsInt, Min, ValidateIf, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingType, BillingOption, InvoiceGenerationType } from '../../infrastructure/transaction/invoice.entity';

export class CreateInvoiceDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  hcfId: string;

  @IsDateString()
  invoiceDate: string;

  @IsDateString()
  dueDate: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingDays?: number;

  @IsEnum(BillingOption)
  billingOption: BillingOption;

  @IsOptional()
  @IsEnum(InvoiceGenerationType)
  generationType?: InvoiceGenerationType;

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

  // Auto-generation fields
  @IsOptional()
  @IsDateString()
  billingPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  billingPeriodEnd?: string;
}
