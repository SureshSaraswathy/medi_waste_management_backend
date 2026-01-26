import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsOptional } from 'class-validator';

export class PcbZoneResponseDto extends BaseMasterResponseDto {
  @IsString()
  pcbZoneName: string;

  @IsString()
  @IsOptional()
  pcbZoneAddress?: string;

  @IsString()
  @IsOptional()
  contactNum?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  alertEmail?: string;
}
