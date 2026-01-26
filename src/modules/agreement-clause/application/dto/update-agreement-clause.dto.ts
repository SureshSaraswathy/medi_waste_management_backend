import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';

export class UpdateAgreementClauseDto {
  @IsOptional()
  @IsString()
  pointNum?: string;

  @IsOptional()
  @IsString()
  pointTitle?: string;

  @IsOptional()
  @IsString()
  pointText?: string;

  @IsOptional()
  @IsInt()
  sequenceNo?: number;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}
