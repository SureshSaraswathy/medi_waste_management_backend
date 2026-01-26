import { IsUUID, IsDateString, IsNumber, IsEnum, IsOptional, IsString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMode } from '../../domain/entities/payment.domain.entity';

export class InvoiceAllocationDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  @Min(0) // Allow 0 for FIFO mode (0 indicates FIFO allocation)
  allocatedAmount: number;
}

export class CreatePaymentDto {
  @IsUUID()
  companyId: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceAllocationDto)
  invoiceAllocations: InvoiceAllocationDto[]; // Manual allocation (optional, FIFO if not provided)
}
