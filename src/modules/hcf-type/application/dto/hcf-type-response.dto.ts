import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID } from 'class-validator';

export class HcfTypeResponseDto extends BaseMasterResponseDto {
  @IsString()
  hcfTypeCode: string;

  @IsString()
  hcfTypeName: string;

  @IsUUID()
  companyId: string;
}
