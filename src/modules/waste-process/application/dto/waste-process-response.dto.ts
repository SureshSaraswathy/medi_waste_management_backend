import { IsUUID, IsDateString, IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { WasteProcessStatus } from '../../infrastructure/transaction/waste-process.entity';

export class WasteProcessResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  companyId: string;

  @IsDateString()
  processDate: string;

  @IsNumber()
  incinerationWeightKg: number;

  @IsNumber()
  autoclaveWeightKg: number;

  @IsEnum(WasteProcessStatus)
  status: WasteProcessStatus;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsUUID()
  @IsOptional()
  createdBy?: string | null;

  @IsDateString()
  createdOn: string;

  @IsUUID()
  @IsOptional()
  modifiedBy?: string | null;

  @IsDateString()
  @IsOptional()
  modifiedOn?: string | null;

  @IsUUID()
  @IsOptional()
  verifiedBy?: string | null;

  @IsDateString()
  @IsOptional()
  verifiedOn?: string | null;

  @IsUUID()
  @IsOptional()
  closedBy?: string | null;

  @IsDateString()
  @IsOptional()
  closedOn?: string | null;
}
