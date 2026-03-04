import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class DistrictResponseDto extends BaseMasterResponseDto {
  @IsString()
  districtCode: string;

  @IsString()
  districtName: string;

  @IsUUID()
  @IsOptional()
  stateId?: string | null;
}
