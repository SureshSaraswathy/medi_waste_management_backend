import { BaseMasterResponseDto } from '../../../../common/base/master-data.base.dto';
import { IsString, IsOptional } from 'class-validator';

export class AgreementTemplateResponseDto extends BaseMasterResponseDto {
  @IsString()
  templateCode: string;

  @IsString()
  templateName: string;

  @IsString()
  @IsOptional()
  agreementCategory?: string | null;

  @IsString()
  @IsOptional()
  templateDescription?: string | null;
}
