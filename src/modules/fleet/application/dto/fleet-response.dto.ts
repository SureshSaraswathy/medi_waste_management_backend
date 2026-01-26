import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class FleetResponseDto extends BaseMasterResponseDto {
  @IsString()
  vehicleNum: string;

  @IsUUID()
  companyId: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsString()
  @IsOptional()
  vehMake?: string;

  @IsString()
  @IsOptional()
  vehModel?: string;

  @IsString()
  @IsOptional()
  mfgYear?: string;

  @IsString()
  @IsOptional()
  nextFCDate?: string;

  @IsString()
  @IsOptional()
  pucDateValidUpto?: string;

  @IsString()
  @IsOptional()
  insuranceValidUpto?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerContact?: string;

  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  ownerPAN?: string;

  @IsString()
  @IsOptional()
  ownerAadhaar?: string;

  @IsString()
  @IsOptional()
  pymtToName?: string;

  @IsString()
  @IsOptional()
  pymtBankName?: string;

  @IsString()
  @IsOptional()
  pymtAccNum?: string;

  @IsString()
  @IsOptional()
  pymtIFSCode?: string;

  @IsString()
  @IsOptional()
  pymtBranch?: string;

  @IsString()
  @IsOptional()
  contractAmount?: string;

  @IsBoolean()
  @IsOptional()
  tdsExemption?: boolean;
}
