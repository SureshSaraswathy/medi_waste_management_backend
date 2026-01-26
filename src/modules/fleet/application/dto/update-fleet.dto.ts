import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateFleetDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  capacity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  vehMake?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  vehModel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  mfgYear?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nextFCDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  pucDateValidUpto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  insuranceValidUpto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ownerContact?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ownerPAN?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ownerAadhaar?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pymtToName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pymtBankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  pymtAccNum?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  pymtIFSCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pymtBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contractAmount?: string;

  @IsBoolean()
  @IsOptional()
  tdsExemption?: boolean;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
