import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateManualReceiptDto {
  @IsUUID()
  paymentId: string;

  @IsOptional()
  @IsDateString()
  receiptDate?: string; // Optional: defaults to payment date

  @IsOptional()
  @IsString()
  notes?: string | null;
}
