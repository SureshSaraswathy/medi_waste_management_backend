/**
 * Dashboard Module
 * 
 * Module for dashboard data and configuration management.
 * 
 * This module provides:
 * - Dashboard configuration API endpoints
 * - Dashboard KPI, Chart, Table, Task, and Alert endpoints
 * - Role-based dashboard configuration management
 * - Widget and menu item configuration
 * 
 * IMPORTANT: This module is isolated and does not affect existing business logic.
 * Dashboard APIs are read-only and do not modify business data.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardKpiService } from './services/dashboard-kpi.service';
import { DashboardChartService } from './services/dashboard-chart.service';
import { DashboardTableService } from './services/dashboard-table.service';
import { DashboardTaskService } from './services/dashboard-task.service';
import { DashboardCatalogService } from './services/dashboard-catalog.service';
import { InvoiceEntity } from '../invoice/infrastructure/transaction/invoice.entity';
import { PaymentEntity } from '../payment/infrastructure/transaction/payment.entity';
import { DashboardConfigEntity } from './entities/dashboard-config.entity';

@Module({
  imports: [
    // Import entities for read-only queries
    // Dashboard APIs are read-only and do not modify business logic
    TypeOrmModule.forFeature([InvoiceEntity], 'transaction'),
    TypeOrmModule.forFeature([PaymentEntity], 'transaction'),
    // Dashboard configuration entity (stored in report database)
    TypeOrmModule.forFeature([DashboardConfigEntity], 'report'),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardKpiService,
    DashboardChartService,
    DashboardTableService,
    DashboardTaskService,
    DashboardCatalogService,
  ],
  exports: [
    DashboardService,
    DashboardKpiService,
    DashboardChartService,
    DashboardTableService,
    DashboardTaskService,
    DashboardCatalogService,
  ],
})
export class DashboardModule {}
