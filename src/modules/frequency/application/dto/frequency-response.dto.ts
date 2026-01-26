import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID } from 'class-validator';

export class FrequencyResponseDto extends BaseMasterResponseDto {
  @IsString()
  frequencyCode: string;

  @IsString()
  frequencyName: string;

  @IsUUID()
  companyId: string;
}
