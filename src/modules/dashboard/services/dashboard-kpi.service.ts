/**
 * Dashboard KPI Service
 * 
 * Provides read-only KPI data for dashboard widgets.
 * Dashboard APIs are read-only and do not modify business logic.
 * 
 * IMPORTANT: All queries are SELECT-only. No INSERT, UPDATE, or DELETE operations.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceStatus } from '../../invoice/infrastructure/transaction/invoice.entity';
import { PaymentEntity, PaymentStatus } from '../../payment/infrastructure/transaction/payment.entity';
import { DashboardKpiResponseDto } from '../dto/dashboard-kpi.dto';

@Injectable()
export class DashboardKpiService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity, 'transaction')
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Get total invoices count
   * READ-ONLY query - does not modify business logic
   */
  async getTotalInvoices(): Promise<DashboardKpiResponseDto> {
    const count = await this.invoiceRepository.count({
      where: { isDeleted: false },
    });

    return {
      label: 'Total Invoices',
      value: count,
      format: 'number',
    };
  }

  /**
   * Get pending invoices count
   * READ-ONLY query - does not modify business logic
   */
  async getPendingInvoices(): Promise<DashboardKpiResponseDto> {
    const count = await this.invoiceRepository.count({
      where: {
        isDeleted: false,
        status: InvoiceStatus.GENERATED,
      },
    });

    // Calculate trend (placeholder - in production, compare with previous period)
    const previousCount = 0; // TODO: Calculate from previous period
    const trend = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;

    return {
      label: 'Pending Invoices',
      value: count,
      trend: Math.round(trend * 10) / 10,
      format: 'number',
    };
  }

  /**
   * Get total revenue
   * READ-ONLY query - does not modify business logic
   */
  async getTotalRevenue(): Promise<DashboardKpiResponseDto> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.invoiceValue), 0)', 'total')
      .where('invoice.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne();

    const total = parseFloat(result?.total || '0');

    return {
      label: 'Total Revenue',
      value: total,
      format: 'currency',
      unit: 'INR',
    };
  }

  /**
   * Get pending payments count
   * READ-ONLY query - does not modify business logic
   */
  async getPendingPayments(): Promise<DashboardKpiResponseDto> {
    const count = await this.paymentRepository.count({
      where: {
        isDeleted: false,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      label: 'Pending Payments',
      value: count,
      format: 'number',
    };
  }

  /**
   * Get receipts count for today
   * READ-ONLY query - does not modify business logic
   */
  async getReceiptsToday(): Promise<DashboardKpiResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.paymentDate >= :today', { today })
      .andWhere('payment.paymentDate < :tomorrow', { tomorrow })
      .getCount();

    return {
      label: 'Receipts Today',
      value: count,
      format: 'number',
    };
  }

  /**
   * Get active users count
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from user table.
   */
  async getActiveUsers(): Promise<DashboardKpiResponseDto> {
    // Placeholder: Return mock data
    // In production, query from user table with active status
    return {
      label: 'Active Users',
      value: 0,
      format: 'number',
    };
  }

  /**
   * Get errors count for today
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from error log table.
   */
  async getErrorsToday(): Promise<DashboardKpiResponseDto> {
    // Placeholder: Return mock data
    // In production, query from error log table
    return {
      label: 'Errors Today',
      value: 0,
      format: 'number',
    };
  }
}
