import { IsEnum, IsOptional } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateFrequencyDto {
  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
