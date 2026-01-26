import { Injectable, Inject } from '@nestjs/common';
import { IReceiptRepository, RECEIPT_REPOSITORY_TOKEN } from '../../domain/interfaces/payment.repository.interface';

@Injectable()
export class ReceiptNumberService {
  constructor(
    @Inject(RECEIPT_REPOSITORY_TOKEN)
    private readonly receiptRepository: IReceiptRepository,
  ) {}

  /**
   * Get financial year from a date
   * Format: "2024-25" (April to March)
   */
  getFinancialYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // Financial year in India: April (4) to March (3)
    if (month >= 4) {
      // April to December: Current year to next year
      const nextYear = (year + 1).toString().slice(-2);
      return `${year}-${nextYear}`;
    } else {
      // January to March: Previous year to current year
      const prevYear = (year - 1).toString();
      const currentYear = year.toString().slice(-2);
      return `${prevYear}-${currentYear}`;
    }
  }

  /**
   * Generate receipt number with FY reset logic
   * Format: RCPT-YYYY-YY-0001
   */
  async generateReceiptNumber(receiptDate: Date, companyId: string): Promise<{ receiptNumber: string; financialYear: string; sequenceNumber: number }> {
    const financialYear = this.getFinancialYear(receiptDate);
    const lastSequence = await this.receiptRepository.findLastSequenceForFinancialYear(financialYear);
    const sequenceNumber = lastSequence + 1;

    // Format: RCPT-YYYY-YY-0001
    const sequenceStr = sequenceNumber.toString().padStart(4, '0');
    const receiptNumber = `RCPT-${financialYear.replace('-', '')}-${sequenceStr}`;

    return {
      receiptNumber,
      financialYear,
      sequenceNumber,
    };
  }
}
