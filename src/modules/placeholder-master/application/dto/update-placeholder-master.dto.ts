import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdatePlaceholderMasterDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  placeholderDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sourceTable?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sourceColumn?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
