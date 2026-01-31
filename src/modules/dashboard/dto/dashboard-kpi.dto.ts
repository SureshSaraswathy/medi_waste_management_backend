/**
 * Dashboard KPI DTOs
 * 
 * Data Transfer Objects for dashboard KPI endpoints.
 * Dashboard APIs are read-only and do not modify business logic.
 */

export class DashboardKpiResponseDto {
  label: string;
  value: number | string;
  trend?: number; // Percentage change (positive or negative)
  format: 'number' | 'currency' | 'percentage';
  unit?: string;
  timestamp?: Date;
}
