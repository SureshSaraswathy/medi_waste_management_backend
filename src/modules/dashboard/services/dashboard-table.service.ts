/**
 * Dashboard Table Service
 * 
 * Provides read-only table data for dashboard widgets.
 * Dashboard APIs are read-only and do not modify business logic.
 * 
 * IMPORTANT: All queries are SELECT-only. No INSERT, UPDATE, or DELETE operations.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { InvoiceEntity } from '../../invoice/infrastructure/transaction/invoice.entity';
import { PaymentEntity } from '../../payment/infrastructure/transaction/payment.entity';
import { DashboardTableResponseDto } from '../dto/dashboard-table.dto';

@Injectable()
export class DashboardTableService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity, 'transaction')
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Get recent invoices
   * READ-ONLY query - does not modify business logic
   */
  async getRecentInvoices(limit: number = 10): Promise<DashboardTableResponseDto> {
    const invoices = await this.invoiceRepository.find({
      where: { isDeleted: false },
      order: { createdOn: 'DESC' },
      take: limit,
    });

    const columns = ['Invoice Number', 'Date', 'HCF', 'Amount', 'Status'];
    const rows = invoices.map((invoice) => ({
      'Invoice Number': invoice.invoiceNumber,
      'Date': invoice.invoiceDate.toISOString().split('T')[0],
      'HCF': invoice.hcfId, // TODO: Join with HCF table to get name
      'Amount': invoice.invoiceValue,
      'Status': invoice.status,
    }));

    return {
      columns,
      rows,
      total: invoices.length,
    };
  }

  /**
   * Get recent payments
   * READ-ONLY query - does not modify business logic
   */
  async getRecentPayments(limit: number = 10): Promise<DashboardTableResponseDto> {
    const payments = await this.paymentRepository.find({
      where: { isDeleted: false },
      order: { createdOn: 'DESC' },
      take: limit,
    });

    const columns = ['Payment Date', 'Amount', 'Mode', 'Reference', 'Status'];
    const rows = payments.map((payment) => ({
      'Payment Date': payment.paymentDate.toISOString().split('T')[0],
      'Amount': payment.paymentAmount,
      'Mode': payment.paymentMode,
      'Reference': payment.referenceNumber || '-',
      'Status': payment.status,
    }));

    return {
      columns,
      rows,
      total: payments.length,
    };
  }

  /**
   * Get pending receipts
   * READ-ONLY query - does not modify business logic
   */
  async getPendingReceipts(limit: number = 10): Promise<DashboardTableResponseDto> {
    const payments = await this.paymentRepository.find({
      where: {
        isDeleted: false,
        receiptId: IsNull(), // Payments without receipts
      },
      order: { paymentDate: 'DESC' },
      take: limit,
    });

    const columns = ['Payment Date', 'Amount', 'Mode', 'Company'];
    const rows = payments.map((payment) => ({
      'Payment Date': payment.paymentDate.toISOString().split('T')[0],
      'Amount': payment.paymentAmount,
      'Mode': payment.paymentMode,
      'Company': payment.companyId, // TODO: Join with company table to get name
    }));

    return {
      columns,
      rows,
      total: payments.length,
    };
  }

  /**
   * Get audit logs
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from audit log table.
   */
  async getAuditLogs(limit: number = 10): Promise<DashboardTableResponseDto> {
    // Placeholder: Return mock data
    // In production, query from audit log table
    const columns = ['Date', 'User', 'Action', 'Entity', 'Status'];
    const rows: Array<Record<string, any>> = [];

    return {
      columns,
      rows,
      total: 0,
    };
  }

  /**
   * Get assigned trips
   * READ-ONLY query - does not modify business logic
   * NOTE: This is a placeholder. In production, query from route assignment or waste collection table.
   */
  async getAssignedTrips(limit: number = 10): Promise<DashboardTableResponseDto> {
    // Placeholder: Return mock data
    // In production, query from route assignment or waste collection table
    const columns = ['Date', 'Route', 'Vehicle', 'Driver', 'Status'];
    const rows: Array<Record<string, any>> = [];

    return {
      columns,
      rows,
      total: 0,
    };
  }
}
