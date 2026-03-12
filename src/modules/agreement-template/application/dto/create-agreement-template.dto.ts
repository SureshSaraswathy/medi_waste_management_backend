import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class CreateAgreementTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  templateName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  agreementCategory?: string;

  @IsString()
  @IsOptional()
  templateDescription?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
