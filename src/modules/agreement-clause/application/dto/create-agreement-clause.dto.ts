import { IsString, IsUUID, IsInt, IsEnum, IsOptional } from 'class-validator';

export class CreateAgreementClauseDto {
  @IsUUID()
  agreementTemplateId: string;

  @IsString()
  pointNum: string;

  @IsString()
  pointTitle: string;

  @IsString()
  pointText: string;

  @IsInt()
  sequenceNo: number;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}
