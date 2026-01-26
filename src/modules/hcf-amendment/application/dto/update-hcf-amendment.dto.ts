import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateHcfAmendmentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  amendmentType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  amendmentDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  amendmentStatus?: string;

  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  approvedDate?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  masterStatus?: MasterStatus;
}
