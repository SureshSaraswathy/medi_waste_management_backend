import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Unified Invoice Report Filter DTO
 * Used for: Table load, Apply Filters, Pagination, Export
 */
export class InvoiceReportRequestDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  // Date Range Filters
  @IsOptional()
  @IsDateString()
  invoiceFromDate?: string;

  @IsOptional()
  @IsDateString()
  invoiceToDate?: string;

  // Entity Filters
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  hcfId?: string;

  // Status Filters
  @IsOptional()
  @IsString()
  @IsIn(['Draft', 'Generated', 'Partially Paid', 'Paid', 'Cancelled', 'All'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Monthly', 'Quarterly', 'Yearly', 'All'])
  billingType?: string;

  // Search
  @IsOptional()
  @IsString()
  searchText?: string;

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn(['invoiceDate', 'invoiceNumber', 'invoiceValue', 'createdOn'])
  sortBy?: string = 'invoiceDate';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // Export
  @IsOptional()
  @IsString()
  @IsIn(['pdf', 'excel', 'csv'])
  export?: string;

  // Legacy field mappings for backward compatibility
  // These will be mapped to new field names in the service
  @IsOptional()
  @IsDateString()
  fromDate?: string; // Maps to invoiceFromDate

  @IsOptional()
  @IsDateString()
  toDate?: string; // Maps to invoiceToDate

  @IsOptional()
  @IsString()
  search?: string; // Maps to searchText

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC'; // Maps to sortOrder
}
