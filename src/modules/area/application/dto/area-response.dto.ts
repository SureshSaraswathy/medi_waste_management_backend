import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString } from 'class-validator';

export class AreaResponseDto extends BaseMasterResponseDto {
  @IsString()
  areaCode: string;

  @IsString()
  areaName: string;

  @IsString()
  areaPincode: string;
}
