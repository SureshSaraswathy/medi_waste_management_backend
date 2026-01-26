import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString } from 'class-validator';

export class StateResponseDto extends BaseMasterResponseDto {
  @IsString()
  stateCode: string;

  @IsString()
  stateName: string;
}
