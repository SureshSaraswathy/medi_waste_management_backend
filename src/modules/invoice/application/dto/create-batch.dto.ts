import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsString, MaxLength } from 'class-validator';
import { BatchType } from '../../infrastructure/transaction/invoice-batch.entity';

export class CreateBatchDto {
  @IsEnum(BatchType)
  @IsNotEmpty()
  type: BatchType;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsUUID()
  @IsOptional()
  siteId?: string;

  @IsDateString()
  @IsOptional()
  periodFrom?: string;

  @IsDateString()
  @IsOptional()
  periodTo?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  billingMonth?: string; // Format: "2024-01" or "January 2024"
}
