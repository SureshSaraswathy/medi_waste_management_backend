import { Injectable } from '@nestjs/common';
import { Invoice } from '../../domain/entities/invoice.domain.entity';

@Injectable()
export class InvoiceLockService {
  /**
   * Check if invoice should be locked
   * Invoice is locked after 20th of the next month from invoice date
   */
  shouldBeLocked(invoiceDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the 20th of next month
    const nextMonth = new Date(invoiceDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(20);
    nextMonth.setHours(23, 59, 59, 999);

    return today > nextMonth;
  }

  /**
   * Get the lock date (20th of next month)
   */
  getLockDate(invoiceDate: Date): Date {
    const lockDate = new Date(invoiceDate);
    lockDate.setMonth(lockDate.getMonth() + 1);
    lockDate.setDate(20);
    lockDate.setHours(23, 59, 59, 999);
    return lockDate;
  }

  /**
   * Check and lock invoice if needed
   */
  checkAndLockInvoice(invoice: Invoice): void {
    if (this.shouldBeLocked(invoice.invoiceDate) && !invoice.isLocked) {
      const lockDate = this.getLockDate(invoice.invoiceDate);
      invoice.lock(lockDate);
    }
  }
}
