/**
 * Dashboard Catalog DTOs
 * 
 * Data Transfer Objects for dashboard API catalog.
 * Dashboard APIs are read-only and do not modify business logic.
 */

export class DashboardCatalogItemDto {
  code: string;
  title: string;
  api: string;
  format?: string;
  chartTypes?: string[];
  roles: string[];
  description?: string;
}

export class DashboardCatalogResponseDto {
  kpis: DashboardCatalogItemDto[];
  charts: DashboardCatalogItemDto[];
  tables: DashboardCatalogItemDto[];
  tasks: DashboardCatalogItemDto[];
  alerts: DashboardCatalogItemDto[];
}
