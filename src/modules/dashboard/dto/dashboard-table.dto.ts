/**
 * Dashboard Table DTOs
 * 
 * Data Transfer Objects for dashboard table endpoints.
 * Dashboard APIs are read-only and do not modify business logic.
 */

export class DashboardTableResponseDto {
  columns: string[];
  rows: Array<Record<string, any>>;
  total?: number;
  page?: number;
  pageSize?: number;
}
