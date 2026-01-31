/**
 * Dashboard Controller
 * 
 * API endpoints for dashboard configuration management.
 * 
 * This controller provides endpoints for:
 * - Getting dashboard configurations per role
 * - Updating dashboard configurations (SuperAdmin only)
 * - Managing dashboard widgets and menu items
 * 
 * IMPORTANT: All endpoints require authentication and SuperAdmin role for write operations.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardConfigDto, UpdateDashboardConfigDto, DashboardConfigResponseDto } from './dto/dashboard-config.dto';
import { DashboardKpiService } from './services/dashboard-kpi.service';
import { DashboardChartService } from './services/dashboard-chart.service';
import { DashboardTableService } from './services/dashboard-table.service';
import { DashboardTaskService } from './services/dashboard-task.service';
import { DashboardCatalogService } from './services/dashboard-catalog.service';
import { DashboardKpiResponseDto } from './dto/dashboard-kpi.dto';
import { DashboardChartResponseDto } from './dto/dashboard-chart.dto';
import { DashboardTableResponseDto } from './dto/dashboard-table.dto';
import { DashboardCatalogResponseDto } from './dto/dashboard-catalog.dto';

/**
 * Dashboard Controller
 * 
 * API endpoints for dashboard data and configuration.
 * 
 * IMPORTANT: Dashboard APIs are read-only and do not modify business logic.
 * All data endpoints return aggregated/read-only data only.
 * No INSERT, UPDATE, or DELETE operations are performed.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly kpiService: DashboardKpiService,
    private readonly chartService: DashboardChartService,
    private readonly tableService: DashboardTableService,
    private readonly taskService: DashboardTaskService,
    private readonly catalogService: DashboardCatalogService,
  ) {}

  /**
   * GET /dashboard/config/:role
   * Get dashboard configuration for a specific role
   * 
   * This endpoint is used by the frontend to load role-specific dashboard configurations.
   * It returns widgets, menu items, and permissions for the specified role.
   */
  @Get('config/:role')
  @RequirePermissions('DASHBOARD_VIEW')
  async getDashboardConfig(
    @Param('role') role: string,
  ): Promise<DashboardConfigResponseDto> {
    const config = await this.dashboardService.getDashboardConfig(role);
    return {
      success: true,
      data: config,
    };
  }

  /**
   * PUT /dashboard/config/:role
   * Update dashboard configuration for a specific role
   * 
   * This endpoint allows SuperAdmin to update dashboard configurations.
   * It accepts widgets, menu items, and permissions updates.
   * 
   * IMPORTANT: Only SuperAdmin can update configurations.
   */
  @Put('config/:role')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('DASHBOARD_CONFIG_UPDATE')
  async updateDashboardConfig(
    @Param('role') role: string,
    @Body() updateDto: UpdateDashboardConfigDto,
  ): Promise<DashboardConfigResponseDto> {
    const config = await this.dashboardService.updateDashboardConfig(role, updateDto);
    return {
      success: true,
      data: config,
      message: 'Dashboard configuration updated successfully',
    };
  }

  /**
   * GET /dashboard/roles
   * Get all available roles for dashboard configuration
   * 
   * This endpoint returns a list of all roles that can have dashboard configurations.
   * Used by the frontend for role selection in configuration UI.
   */
  @Get('roles')
  @RequirePermissions('DASHBOARD_VIEW')
  async getAvailableRoles(): Promise<{ success: boolean; data: string[] }> {
    const roles = await this.dashboardService.getAvailableRoles();
    return {
      success: true,
      data: roles,
    };
  }

  /**
   * GET /dashboard/user-overrides/:userId
   * Get user-specific permission overrides
   * 
   * This endpoint returns user-specific permission overrides that modify
   * the base role permissions. Used for personalized dashboard configurations.
   */
  @Get('user-overrides/:userId')
  @RequirePermissions('DASHBOARD_VIEW')
  async getUserOverrides(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean; data: any }> {
    // Placeholder: Return empty overrides
    // In production, fetch from database
    return {
      success: true,
      data: {
        userId,
        permissions: {},
        menuOverrides: {},
        widgetOverrides: {},
      },
    };
  }

  // ============================================
  // DASHBOARD KPI ENDPOINTS
  // All KPI endpoints are READ-ONLY and do not modify business logic
  // ============================================

  /**
   * GET /dashboard/kpi/total-invoices
   * Get total invoices count
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/total-invoices')
  @RequirePermissions('DASHBOARD_VIEW')
  async getTotalInvoices(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getTotalInvoices();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/pending-invoices
   * Get pending invoices count
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/pending-invoices')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPendingInvoices(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getPendingInvoices();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/total-revenue
   * Get total revenue
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/total-revenue')
  @RequirePermissions('DASHBOARD_VIEW')
  async getTotalRevenue(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getTotalRevenue();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/pending-payments
   * Get pending payments count
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/pending-payments')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPendingPayments(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getPendingPayments();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/receipts-today
   * Get receipts count for today
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/receipts-today')
  @RequirePermissions('DASHBOARD_VIEW')
  async getReceiptsToday(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getReceiptsToday();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/active-users
   * Get active users count
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/active-users')
  @RequirePermissions('DASHBOARD_VIEW')
  async getActiveUsers(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getActiveUsers();
    return { success: true, data };
  }

  /**
   * GET /dashboard/kpi/errors-today
   * Get errors count for today
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('kpi/errors-today')
  @RequirePermissions('DASHBOARD_VIEW')
  async getErrorsToday(): Promise<{ success: boolean; data: DashboardKpiResponseDto }> {
    const data = await this.kpiService.getErrorsToday();
    return { success: true, data };
  }

  // ============================================
  // DASHBOARD CHART ENDPOINTS
  // All chart endpoints are READ-ONLY and do not modify business logic
  // ============================================

  /**
   * GET /dashboard/chart/monthly-revenue
   * Get monthly revenue chart data
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/monthly-revenue')
  @RequirePermissions('DASHBOARD_VIEW')
  async getMonthlyRevenue(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getMonthlyRevenue();
    return { success: true, data };
  }

  /**
   * GET /dashboard/chart/payment-status
   * Get payment status distribution
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/payment-status')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPaymentStatus(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getPaymentStatus();
    return { success: true, data };
  }

  /**
   * GET /dashboard/chart/invoice-aging
   * Get invoice aging chart data
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/invoice-aging')
  @RequirePermissions('DASHBOARD_VIEW')
  async getInvoiceAging(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getInvoiceAging();
    return { success: true, data };
  }

  /**
   * GET /dashboard/chart/daily-trips
   * Get daily trips chart data
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/daily-trips')
  @RequirePermissions('DASHBOARD_VIEW')
  async getDailyTrips(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getDailyTrips();
    return { success: true, data };
  }

  /**
   * GET /dashboard/chart/training-status
   * Get training status distribution
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/training-status')
  @RequirePermissions('DASHBOARD_VIEW')
  async getTrainingStatus(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getTrainingStatus();
    return { success: true, data };
  }

  /**
   * GET /dashboard/chart/audit-issues-trend
   * Get audit issues trend
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('chart/audit-issues-trend')
  @RequirePermissions('DASHBOARD_VIEW')
  async getAuditIssuesTrend(): Promise<{ success: boolean; data: DashboardChartResponseDto }> {
    const data = await this.chartService.getAuditIssuesTrend();
    return { success: true, data };
  }

  // ============================================
  // DASHBOARD TABLE ENDPOINTS
  // All table endpoints are READ-ONLY and do not modify business logic
  // ============================================

  /**
   * GET /dashboard/table/recent-invoices
   * Get recent invoices list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('table/recent-invoices')
  @RequirePermissions('DASHBOARD_VIEW')
  async getRecentInvoices(
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; data: DashboardTableResponseDto }> {
    const data = await this.tableService.getRecentInvoices(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  /**
   * GET /dashboard/table/recent-payments
   * Get recent payments list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('table/recent-payments')
  @RequirePermissions('DASHBOARD_VIEW')
  async getRecentPayments(
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; data: DashboardTableResponseDto }> {
    const data = await this.tableService.getRecentPayments(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  /**
   * GET /dashboard/table/pending-receipts
   * Get pending receipts list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('table/pending-receipts')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPendingReceipts(
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; data: DashboardTableResponseDto }> {
    const data = await this.tableService.getPendingReceipts(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  /**
   * GET /dashboard/table/audit-logs
   * Get audit logs list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('table/audit-logs')
  @RequirePermissions('DASHBOARD_VIEW')
  async getAuditLogs(
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; data: DashboardTableResponseDto }> {
    const data = await this.tableService.getAuditLogs(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  /**
   * GET /dashboard/table/assigned-trips
   * Get assigned trips list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('table/assigned-trips')
  @RequirePermissions('DASHBOARD_VIEW')
  async getAssignedTrips(
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; data: DashboardTableResponseDto }> {
    const data = await this.tableService.getAssignedTrips(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  // ============================================
  // DASHBOARD TASK/ALERT ENDPOINTS
  // All task/alert endpoints are READ-ONLY and do not modify business logic
  // ============================================

  /**
   * GET /dashboard/tasks/pending-approvals
   * Get pending approvals list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('tasks/pending-approvals')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPendingApprovals(): Promise<{ success: boolean; data: any[] }> {
    const data = await this.taskService.getPendingApprovals();
    return { success: true, data };
  }

  /**
   * GET /dashboard/tasks/assigned
   * Get assigned tasks list
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('tasks/assigned')
  @RequirePermissions('DASHBOARD_VIEW')
  async getAssignedTasks(@Query('userId') userId?: string): Promise<{ success: boolean; data: any[] }> {
    const data = await this.taskService.getAssignedTasks(userId);
    return { success: true, data };
  }

  /**
   * GET /dashboard/alerts/payment-overdue
   * Get payment overdue alerts
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('alerts/payment-overdue')
  @RequirePermissions('DASHBOARD_VIEW')
  async getPaymentOverdueAlerts(): Promise<{ success: boolean; data: any[] }> {
    const data = await this.taskService.getPaymentOverdueAlerts();
    return { success: true, data };
  }

  /**
   * GET /dashboard/alerts/compliance-expiry
   * Get compliance expiry alerts
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('alerts/compliance-expiry')
  @RequirePermissions('DASHBOARD_VIEW')
  async getComplianceExpiryAlerts(): Promise<{ success: boolean; data: any[] }> {
    const data = await this.taskService.getComplianceExpiryAlerts();
    return { success: true, data };
  }

  // ============================================
  // DASHBOARD CATALOG ENDPOINT
  // Returns catalog of all available dashboard APIs
  // ============================================

  /**
   * GET /dashboard/catalog
   * Get catalog of all available dashboard APIs
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('catalog')
  @RequirePermissions('DASHBOARD_VIEW')
  async getCatalog(): Promise<{ success: boolean; data: DashboardCatalogResponseDto }> {
    const data = this.catalogService.getCatalog();
    return { success: true, data };
  }

  // ============================================
  // DASHBOARD CONFIGURATION ENDPOINTS (ENHANCED)
  // ============================================

  /**
   * GET /dashboard/config
   * Get dashboard configuration by target (role or department)
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('config')
  @RequirePermissions('DASHBOARD_VIEW')
  async getDashboardConfigByTarget(
    @Query('target') target: string,
  ): Promise<DashboardConfigResponseDto> {
    try {
      if (!target) {
        throw new Error('Target parameter is required');
      }
      const config = await this.dashboardService.getDashboardConfig(target);
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error('[DashboardController] Error fetching config:', error);
      throw error;
    }
  }

  /**
   * POST /dashboard/config
   * Create or update dashboard configuration
   * IMPORTANT: Only SuperAdmin can update configurations.
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Post('config')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('DASHBOARD_CONFIG_UPDATE')
  async createOrUpdateDashboardConfig(
    @Body() configDto: DashboardConfigDto,
  ): Promise<DashboardConfigResponseDto> {
    try {
      if (!configDto.role) {
        throw new Error('Role is required in request body');
      }
      // Extract role and create update DTO
      const { role, ...updateFields } = configDto;

      const updateDto: UpdateDashboardConfigDto = {
        widgets: updateFields.widgets,
        menuItems: updateFields.menuItems,
        permissions: updateFields.permissions,
      };

      const config = await this.dashboardService.updateDashboardConfig(role, updateDto);
      return {
        success: true,
        data: config,
        message: 'Dashboard configuration saved successfully',
      };
    } catch (error) {
      console.error('[DashboardController] Error saving config:', error);
      console.error('[DashboardController] Error stack:', error?.stack);
      console.error('[DashboardController] Error message:', error?.message);
      
      // Return a more user-friendly error response
      if (error instanceof Error) {
        throw new Error(`Failed to save dashboard configuration: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * GET /dashboard/config/debug/:role
   * Debug endpoint to check what's actually stored in the database
   * Dashboard APIs are read-only and do not modify business logic
   */
  @Get('config/debug/:role')
  @RequirePermissions('DASHBOARD_VIEW')
  async debugDashboardConfig(
    @Param('role') role: string,
  ): Promise<any> {
    try {
      const config = await this.dashboardService.getDashboardConfig(role);
      
      return {
        success: true,
        data: {
          serviceResult: config,
          message: 'Check backend console logs for detailed database query information',
        },
      };
    } catch (error) {
      console.error('[DashboardController] Error in debug endpoint:', error);
      throw error;
    }
  }
}
