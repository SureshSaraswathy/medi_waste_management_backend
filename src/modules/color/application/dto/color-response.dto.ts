import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID } from 'class-validator';

export class ColorResponseDto extends BaseMasterResponseDto {
  @IsString()
  colorName: string;

  @IsUUID()
  companyId: string;
}
