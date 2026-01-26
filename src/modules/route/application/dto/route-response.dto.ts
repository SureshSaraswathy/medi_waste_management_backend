import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class RouteResponseDto extends BaseMasterResponseDto {
  @IsString()
  routeCode: string;

  @IsString()
  routeName: string;

  @IsUUID()
  companyId: string;

  @IsUUID()
  @IsOptional()
  frequencyId?: string;
}
