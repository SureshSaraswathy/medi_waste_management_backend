import { IsString, IsUUID, IsDateString, IsEnum, IsOptional, IsArray, IsInt } from 'class-validator';
import { BillingType } from '../../infrastructure/transaction/invoice.entity';

export class GenerateInvoiceDto {
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  hcfIds?: string[]; // If not provided, generate for all active HCFs

  @IsDateString()
  billingPeriodStart: string;

  @IsDateString()
  billingPeriodEnd: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string; // Defaults to billingPeriodEnd

  @IsOptional()
  @IsInt()
  dueDays?: number; // Defaults to 30 days from invoice date
}
