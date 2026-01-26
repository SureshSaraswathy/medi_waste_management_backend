import { IsEnum, IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdatePcbZoneDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  pcbZoneAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactNum?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  alertEmail?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
