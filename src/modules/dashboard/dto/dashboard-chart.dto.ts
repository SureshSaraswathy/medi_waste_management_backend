/**
 * Dashboard Chart DTOs
 * 
 * Data Transfer Objects for dashboard chart endpoints.
 * Dashboard APIs are read-only and do not modify business logic.
 */

export class DashboardChartResponseDto {
  labels: string[];
  data: number[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
  metadata?: {
    total?: number;
    period?: string;
    [key: string]: any;
  };
}
