import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MasterStatus } from './master-data.base.entity';

/**
 * Base DTO for Master Data Create operations
 */
export class BaseCreateMasterDto {
  @IsString()
  createdBy?: string | null;
}

/**
 * Base DTO for Master Data Update operations
 */
export class BaseUpdateMasterDto {
  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;

  @IsString()
  @IsOptional()
  modifiedBy?: string | null;
}

/**
 * Base DTO for Master Data Response
 */
export class BaseMasterResponseDto {
  @IsUUID()
  id: string;

  @IsEnum(MasterStatus)
  status: MasterStatus;

  @IsString()
  @IsOptional()
  createdBy?: string | null;

  createdOn: string;

  @IsString()
  @IsOptional()
  modifiedBy?: string | null;

  modifiedOn: string;
}
