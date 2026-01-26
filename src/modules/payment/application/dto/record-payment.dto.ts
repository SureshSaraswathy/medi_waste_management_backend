import { IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMode } from '../../domain/entities/payment.domain.entity';

/**
 * DTO for recording a payment against a single invoice
 * Simplified flow for offline payments (NEFT, RTGS, Cash, Cheque)
 */
export class RecordPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsDateString()
  paymentDate: string;

  @IsNumber()
  @Min(0.01)
  paymentAmount: number;

  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @IsOptional()
  @IsString()
  referenceNumber?: string | null;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  chequeNumber?: string | null;

  @IsOptional()
  @IsDateString()
  chequeDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
