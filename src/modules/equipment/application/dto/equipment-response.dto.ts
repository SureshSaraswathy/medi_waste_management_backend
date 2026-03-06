import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class EquipmentResponseDto extends BaseMasterResponseDto {
  @IsUUID()
  companyId: string;

  @IsString()
  equipmentCode: string;

  @IsString()
  equipmentName: string;

  @IsString()
  @IsOptional()
  equipmentType?: string | null;

  @IsString()
  @IsOptional()
  make?: string | null;

  @IsString()
  @IsOptional()
  capacity?: string | null;
}
