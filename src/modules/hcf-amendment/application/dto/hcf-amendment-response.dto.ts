import { IsString, IsUUID, IsOptional } from 'class-validator';

export class HcfAmendmentResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  hcfId: string;

  @IsString()
  amendmentType: string;

  @IsString()
  amendmentDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  approvedDate?: string;

  @IsUUID()
  @IsOptional()
  createdBy?: string | null;

  createdOn: string;

  @IsUUID()
  @IsOptional()
  modifiedBy?: string | null;

  modifiedOn: string;
}
