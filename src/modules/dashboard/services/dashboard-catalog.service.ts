/**
 * Dashboard Catalog Service
 * 
 * Provides catalog of all available dashboard APIs.
 * Dashboard APIs are read-only and do not modify business logic.
 */

import { Injectable } from '@nestjs/common';
import { DashboardCatalogResponseDto, DashboardCatalogItemDto } from '../dto/dashboard-catalog.dto';

@Injectable()
export class DashboardCatalogService {
  /**
   * Get complete catalog of dashboard APIs
   * This catalog defines all available dashboard endpoints and their access roles
   */
  getCatalog(): DashboardCatalogResponseDto {
    const kpis: DashboardCatalogItemDto[] = [
      {
        code: 'TOTAL_INVOICES',
        title: 'Total Invoices',
        api: '/api/v1/dashboard/kpi/total-invoices',
        format: 'number',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Total count of all invoices',
      },
      {
        code: 'PENDING_INVOICES',
        title: 'Pending Invoices',
        api: '/api/v1/dashboard/kpi/pending-invoices',
        format: 'number',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Count of invoices pending approval',
      },
      {
        code: 'TOTAL_REVENUE',
        title: 'Total Revenue',
        api: '/api/v1/dashboard/kpi/total-revenue',
        format: 'currency',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Total revenue from all invoices',
      },
      {
        code: 'PENDING_PAYMENTS',
        title: 'Pending Payments',
        api: '/api/v1/dashboard/kpi/pending-payments',
        format: 'number',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Count of pending payments',
      },
      {
        code: 'RECEIPTS_TODAY',
        title: 'Receipts Today',
        api: '/api/v1/dashboard/kpi/receipts-today',
        format: 'number',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Number of receipts generated today',
      },
      {
        code: 'ACTIVE_USERS',
        title: 'Active Users',
        api: '/api/v1/dashboard/kpi/active-users',
        format: 'number',
        roles: ['Manager', 'SuperAdmin'],
        description: 'Number of active users in the system',
      },
      {
        code: 'ERRORS_TODAY',
        title: 'Errors Today',
        api: '/api/v1/dashboard/kpi/errors-today',
        format: 'number',
        roles: ['SuperAdmin'],
        description: 'Number of errors logged today',
      },
    ];

    const charts: DashboardCatalogItemDto[] = [
      {
        code: 'MONTHLY_REVENUE',
        title: 'Monthly Revenue',
        api: '/api/v1/dashboard/chart/monthly-revenue',
        chartTypes: ['line', 'bar'],
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Monthly revenue trend for current year',
      },
      {
        code: 'PAYMENT_STATUS',
        title: 'Payment Status Distribution',
        api: '/api/v1/dashboard/chart/payment-status',
        chartTypes: ['pie', 'doughnut'],
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Distribution of payment statuses',
      },
      {
        code: 'INVOICE_AGING',
        title: 'Invoice Aging',
        api: '/api/v1/dashboard/chart/invoice-aging',
        chartTypes: ['bar'],
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Invoice aging analysis by days overdue',
      },
      {
        code: 'DAILY_TRIPS',
        title: 'Daily Trips',
        api: '/api/v1/dashboard/chart/daily-trips',
        chartTypes: ['line', 'bar'],
        roles: ['Supervisor', 'Manager', 'SuperAdmin'],
        description: 'Daily waste collection trips',
      },
      {
        code: 'TRAINING_STATUS',
        title: 'Training Status',
        api: '/api/v1/dashboard/chart/training-status',
        chartTypes: ['pie', 'doughnut'],
        roles: ['Manager', 'SuperAdmin'],
        description: 'Training certificate status distribution',
      },
      {
        code: 'AUDIT_ISSUES_TREND',
        title: 'Audit Issues Trend',
        api: '/api/v1/dashboard/chart/audit-issues-trend',
        chartTypes: ['line'],
        roles: ['Audit', 'Manager', 'SuperAdmin'],
        description: 'Trend of audit issues over time',
      },
    ];

    const tables: DashboardCatalogItemDto[] = [
      {
        code: 'RECENT_INVOICES',
        title: 'Recent Invoices',
        api: '/api/v1/dashboard/table/recent-invoices',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'List of most recent invoices',
      },
      {
        code: 'RECENT_PAYMENTS',
        title: 'Recent Payments',
        api: '/api/v1/dashboard/table/recent-payments',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'List of most recent payments',
      },
      {
        code: 'PENDING_RECEIPTS',
        title: 'Pending Receipts',
        api: '/api/v1/dashboard/table/pending-receipts',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'List of payments pending receipt generation',
      },
      {
        code: 'AUDIT_LOGS',
        title: 'Audit Logs',
        api: '/api/v1/dashboard/table/audit-logs',
        roles: ['Audit', 'Manager', 'SuperAdmin'],
        description: 'Recent audit log entries',
      },
      {
        code: 'ASSIGNED_TRIPS',
        title: 'Assigned Trips',
        api: '/api/v1/dashboard/table/assigned-trips',
        roles: ['Supervisor', 'Driver', 'Manager', 'SuperAdmin'],
        description: 'List of assigned waste collection trips',
      },
    ];

    const tasks: DashboardCatalogItemDto[] = [
      {
        code: 'PENDING_APPROVALS',
        title: 'Pending Approvals',
        api: '/api/v1/dashboard/tasks/pending-approvals',
        roles: ['Manager', 'SuperAdmin'],
        description: 'List of items pending approval',
      },
      {
        code: 'ASSIGNED',
        title: 'Assigned Tasks',
        api: '/api/v1/dashboard/tasks/assigned',
        roles: ['Supervisor', 'Driver', 'Manager', 'SuperAdmin'],
        description: 'Tasks assigned to the current user',
      },
    ];

    const alerts: DashboardCatalogItemDto[] = [
      {
        code: 'PAYMENT_OVERDUE',
        title: 'Payment Overdue',
        api: '/api/v1/dashboard/alerts/payment-overdue',
        roles: ['Accountant', 'Manager', 'SuperAdmin'],
        description: 'Alerts for overdue payments',
      },
      {
        code: 'COMPLIANCE_EXPIRY',
        title: 'Compliance Expiry',
        api: '/api/v1/dashboard/alerts/compliance-expiry',
        roles: ['Manager', 'SuperAdmin'],
        description: 'Alerts for expiring compliance certificates',
      },
    ];

    return {
      kpis,
      charts,
      tables,
      tasks,
      alerts,
    };
  }
}
