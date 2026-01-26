import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateRouteHcfDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  sequenceOrder?: number;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
