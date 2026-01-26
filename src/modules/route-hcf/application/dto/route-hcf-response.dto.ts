import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID, IsOptional, IsInt } from 'class-validator';

export class RouteHcfResponseDto extends BaseMasterResponseDto {
  @IsUUID()
  routeId: string;

  @IsUUID()
  hcfId: string;

  @IsUUID()
  companyId: string;

  @IsInt()
  @IsOptional()
  sequenceOrder?: number;
}
