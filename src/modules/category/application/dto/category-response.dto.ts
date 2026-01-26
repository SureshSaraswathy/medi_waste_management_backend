import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsUUID } from 'class-validator';

export class CategoryResponseDto extends BaseMasterResponseDto {
  @IsString()
  categoryCode: string;

  @IsString()
  categoryName: string;

  @IsUUID()
  companyId: string;
}
