/**
 * Dashboard Chart Service
 * 
 * Provides read-only chart data for dashboard widgets.
 * Dashboard APIs are read-only and do not modify business logic.
 * 
 * IMPORTANT: All queries are SELECT-only. No INSERT, UPDATE, or DELETE operations.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../../invoice/infrastructure/transaction/invoice.entity';
import { PaymentEntity, PaymentStatus } from '../../payment/infrastructure/transaction/payment.entity';
import { DashboardChartResponseDto } from '../dto/dashboard-chart.dto';

@Injectable()
export class DashboardChartService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity, 'transaction')
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Get monthly revenue chart data
   * READ-ONLY query - does not modify business logic
   */
  async getMonthlyRevenue(): Promise<DashboardChartResponseDto> {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const results = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('EXTRACT(MONTH FROM invoice.invoiceDate)', 'month')
      .addSelect('COALESCE(SUM(invoice.invoiceValue), 0)', 'total')
      .where('invoice.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('EXTRACT(YEAR FROM invoice.invoiceDate) = :year', { year: currentYear })
      .groupBy('EXTRACT(MONTH FROM invoice.invoiceDate)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const data = new Array(12).fill(0);
    const labels = months;

    results.forEach((row) => {
      const monthIndex = parseInt(row.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        data[monthIndex] = parseFloat(row.total || '0');
      }
    });

    return {
      labels,
      data,
      metadata: {
        total: data.reduce((sum, val) => sum + val, 0),
        period: `${currentYear}`,
      },
    };
  }

  /**
   * Get payment status distribution
   * READ-ONLY query - does not modify business logic
   */
  async getPaymentStatus(): Promise<DashboardChartResponseDto> {
    const results = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('payment.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('payment.status')
      .getRawMany();

    const labels = results.map((row) => row.status);
    const data = results.map((row) => parseInt(row.count || '0'));

    return {
      labels,
      data,
      metadata: {
        total: data.reduce((sum, val) => sum + val, 0),
      },
    };
  }

  /**
   * Get invoice aging chart data
   * READ-ONLY query - does not modify business logic
   */
  async getInvoiceAging(): Promise<DashboardChartResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agingBuckets = [
      { label: '0-30 days', days: 30 },
      { label: '31-60 days', days: 60 },
      { label: '61-90 days', days: 90 },
      { label: '90+ days', days: Infinity },
    ];

    const labels: string[] = [];
    const data: number[] = [];

    for (const bucket of agingBuckets) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - bucket.days);
      
      const endDate = bucket.days === Infinity ? null : new Date(today);
      if (endDate) {
        endDate.setDate(endDate.getDate() - (bucket.days - 30));
      }

      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('invoice.status != :status', { status: 'Paid' })
        .andWhere('invoice.dueDate < :today', { today });

      if (endDate) {
        query = query.andWhere('invoice.dueDate >= :endDate', { endDate });
      }

      const count = await query.getCount();
      labels.push(bucket.label);
      data.push(count);
    }

    return {
      labels,
      data,
    };
  }

  /**
   * Get daily trips chart data
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from waste collection/transaction table.
   */
  async getDailyTrips(): Promise<DashboardChartResponseDto> {
    // Placeholder: Return mock data
    // In production, query from waste collection or vehicle waste collection table
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [12, 15, 18, 14, 16, 10, 8];

    return {
      labels,
      data,
    };
  }

  /**
   * Get training status distribution
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from training certificate table.
   */
  async getTrainingStatus(): Promise<DashboardChartResponseDto> {
    // Placeholder: Return mock data
    // In production, query from training certificate table
    const labels = ['Completed', 'Pending', 'Expired'];
    const data = [45, 12, 3];

    return {
      labels,
      data,
    };
  }

  /**
   * Get audit issues trend
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from audit log table.
   */
  async getAuditIssuesTrend(): Promise<DashboardChartResponseDto> {
    // Placeholder: Return mock data
    // In production, query from audit log table
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const data = [5, 3, 7, 4];

    return {
      labels,
      data,
    };
  }
}
