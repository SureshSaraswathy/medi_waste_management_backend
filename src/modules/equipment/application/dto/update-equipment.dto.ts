import { IsEnum, IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateEquipmentDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  equipmentType?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  make?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  capacity?: string | null;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
