/**
 * Dashboard Configuration DTOs
 * 
 * Data Transfer Objects for dashboard configuration API endpoints.
 * These DTOs define the structure for managing dashboard configurations per role.
 */

import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class DashboardConfigDto {
  @IsString()
  role: string;
  
  @IsOptional()
  @IsArray()
  widgets?: any[];
  
  @IsOptional()
  @IsArray()
  menuItems?: any[];
  
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

export class UpdateDashboardConfigDto {
  @IsOptional()
  @IsArray()
  widgets?: any[];
  
  @IsOptional()
  @IsArray()
  menuItems?: any[];
  
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

export class DashboardConfigResponseDto {
  success: boolean;
  data: DashboardConfigDto;
  message?: string;
}
