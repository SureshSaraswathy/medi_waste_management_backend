import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateDistrictDto {
  @IsUUID()
  @IsOptional()
  stateId?: string | null;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
