/**
 * Dashboard Task Service
 * 
 * Provides read-only task and alert data for dashboard widgets.
 * Dashboard APIs are read-only and do not modify business logic.
 * 
 * IMPORTANT: All queries are SELECT-only. No INSERT, UPDATE, or DELETE operations.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceStatus } from '../../invoice/infrastructure/transaction/invoice.entity';
import { PaymentEntity, PaymentStatus } from '../../payment/infrastructure/transaction/payment.entity';

export interface DashboardTaskDto {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  status: string;
  assignee?: string;
}

export interface DashboardAlertDto {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
}

@Injectable()
export class DashboardTaskService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity, 'transaction')
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Get pending approvals
   * READ-ONLY query - does not modify business logic
   */
  async getPendingApprovals(): Promise<DashboardTaskDto[]> {
    // Query invoices that need approval (status = Generated)
    const invoices = await this.invoiceRepository.find({
      where: {
        isDeleted: false,
        status: InvoiceStatus.DUE,
      },
      order: { createdOn: 'DESC' },
      take: 20,
    });

    return invoices.map((invoice) => ({
      id: invoice.invoiceId,
      title: `Approve Invoice ${invoice.invoiceNumber}`,
      description: `Invoice for ${invoice.invoiceValue} INR`,
      priority: 'high' as const,
      dueDate: invoice.dueDate,
      status: 'pending',
      assignee: invoice.createdBy || undefined,
    }));
  }

  /**
   * Get assigned tasks
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from task/assignment table.
   */
  async getAssignedTasks(userId?: string): Promise<DashboardTaskDto[]> {
    // Placeholder: Return mock data
    // In production, query from task/assignment table
    return [];
  }

  /**
   * Get payment overdue alerts
   * READ-ONLY query - does not modify business logic
   */
  async getPaymentOverdueAlerts(): Promise<DashboardAlertDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        isDeleted: false,
        status: InvoiceStatus.DUE,
      },
    });

    const alerts: DashboardAlertDto[] = [];

    for (const invoice of overdueInvoices) {
      if (invoice.dueDate < today) {
        const daysOverdue = Math.floor(
          (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        alerts.push({
          id: `overdue-${invoice.invoiceId}`,
          type: daysOverdue > 30 ? 'error' : 'warning',
          title: `Overdue Invoice: ${invoice.invoiceNumber}`,
          message: `Invoice is ${daysOverdue} days overdue. Amount: ${invoice.balanceAmount} INR`,
          timestamp: invoice.dueDate,
          actionUrl: `/finance/invoice-management?invoiceId=${invoice.invoiceId}`,
        });
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get compliance expiry alerts
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from compliance/training certificate table.
   */
  async getComplianceExpiryAlerts(): Promise<DashboardAlertDto[]> {
    // Placeholder: Return mock data
    // In production, query from compliance/training certificate table
    return [];
  }
}
