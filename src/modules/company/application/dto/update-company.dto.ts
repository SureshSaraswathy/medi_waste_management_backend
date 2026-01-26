import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyStatus } from '../../domain/entities/company.domain.entity';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  companyCode?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;
}
