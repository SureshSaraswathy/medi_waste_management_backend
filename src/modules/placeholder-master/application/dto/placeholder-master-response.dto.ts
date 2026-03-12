import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString } from 'class-validator';

export class PlaceholderMasterResponseDto extends BaseMasterResponseDto {
  @IsString()
  placeholderCode: string;

  @IsString()
  placeholderDescription: string;

  @IsString()
  sourceTable: string;

  @IsString()
  sourceColumn: string;
}
