import { IsString, IsNotEmpty, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class CreateHcfAmendmentDto {
  @IsUUID()
  @IsNotEmpty()
  hcfId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  amendmentType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  amendmentDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;

  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  approvedDate?: string;
}
