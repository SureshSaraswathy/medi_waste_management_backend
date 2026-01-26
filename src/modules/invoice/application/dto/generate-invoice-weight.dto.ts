import { IsString, IsUUID, IsDateString, IsEnum, IsOptional, IsArray, IsInt } from 'class-validator';
import { BillingType } from '../../infrastructure/transaction/invoice.entity';

export class GenerateInvoiceWeightDto {
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  hcfIds?: string[]; // If not provided, generate for all active HCFs

  @IsDateString()
  pickupDateFrom: string; // Start date for waste transaction pickup

  @IsDateString()
  pickupDateTo: string; // End date for waste transaction pickup

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string; // Defaults to pickupDateTo

  @IsOptional()
  @IsInt()
  dueDays?: number; // Defaults to 30 days from invoice date
}
