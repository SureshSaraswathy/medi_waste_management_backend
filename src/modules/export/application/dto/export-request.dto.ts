import { IsEnum, IsOptional, IsString, IsDateString, IsArray, ValidateIf, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExportFileType {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ExportModule {
  CERTIFICATE = 'certificate',
  STAFF = 'staff',
  REPORT = 'report',
  USER = 'user',
  HCF = 'hcf',
  HCF_AMENDMENT = 'hcf-amendment',
  INVOICE = 'invoice',
  AGREEMENT = 'agreement',
}

export class ExportRequestDto {
  @IsEnum(ExportModule)
  @IsNotEmpty()
  module: ExportModule;

  @IsEnum(ExportFileType)
  @IsNotEmpty()
  fileType: ExportFileType;

  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @IsDateString()
  @IsNotEmpty()
  dateTo: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  hcfId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalFilters?: string[];

  @IsOptional()
  @IsString()
  reportType?: string; // For report module specific types
}
