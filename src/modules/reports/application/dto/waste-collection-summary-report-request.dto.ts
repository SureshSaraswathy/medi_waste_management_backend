import { IsIn, IsOptional, IsString } from 'class-validator';

export class WasteCollectionSummaryReportRequestDto {
  @IsString()
  @IsIn(['Route', 'HCF', 'Period', 'PCB Zone'])
  option!: 'Route' | 'HCF' | 'Period' | 'PCB Zone';

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  hcfId?: string;

  @IsOptional()
  @IsString()
  pcbZoneId?: string;

  @IsString()
  fromDate!: string;

  @IsString()
  toDate!: string;
}

