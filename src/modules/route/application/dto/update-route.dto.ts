import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateRouteDto {
  @IsUUID()
  @IsOptional()
  frequencyId?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
