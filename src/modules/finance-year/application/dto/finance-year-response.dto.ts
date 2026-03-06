import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsDateString } from 'class-validator';

export class FinanceYearResponseDto extends BaseMasterResponseDto {
  @IsString()
  finYear: string; // Format: YYYY-YY (e.g., 2025-26)

  @IsDateString()
  fyStartDate: string; // ISO date string

  @IsDateString()
  fyEndDate: string; // ISO date string
}
