import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { CompanyStatus } from '../../domain/entities/company.domain.entity';

export class CompanyResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  companyCode: string;

  @IsString()
  companyName: string;

  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @IsString()
  @IsOptional()
  createdBy?: string | null;

  createdOn: string;

  @IsString()
  @IsOptional()
  modifiedBy?: string | null;

  modifiedOn: string;
}
