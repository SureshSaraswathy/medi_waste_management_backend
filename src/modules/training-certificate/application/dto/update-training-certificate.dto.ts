import { IsString, IsOptional, IsUUID, IsDateString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateTrainingCertificateDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  staffName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  staffCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  designation?: string;

  @IsUUID()
  @IsOptional()
  hcfId?: string;

  @IsDateString()
  @IsOptional()
  trainingDate?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  trainedBy?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
