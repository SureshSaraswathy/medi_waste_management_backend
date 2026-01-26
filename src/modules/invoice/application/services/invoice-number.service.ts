import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';

@Injectable()
export class InvoiceNumberService {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
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
   * Generate invoice number with FY reset logic
   * Format: {PREFIX}-{SEQUENCE}/{FY}
   * Example: MWM-000001/24-25
   * If prefix not provided, uses "INV" as default
   */
  async generateInvoiceNumber(
    invoiceDate: Date,
    companyPrefix?: string,
  ): Promise<{ invoiceNumber: string; financialYear: string; sequenceNumber: number }> {
    const financialYear = this.getFinancialYear(invoiceDate);
    const lastSequence = await this.invoiceRepository.findLastSequenceForFinancialYear(financialYear);
    const sequenceNumber = lastSequence + 1;

    // Format: PREFIX-000001/YY-YY
    const prefix = companyPrefix || 'INV';
    const sequenceStr = sequenceNumber.toString().padStart(6, '0');
    
    // Get last 2 digits of years for FY format (e.g., 24-25)
    const fyParts = financialYear.split('-');
    const fyShort = `${fyParts[0].slice(-2)}-${fyParts[1]}`;
    
    const invoiceNumber = `${prefix}-${sequenceStr}/${fyShort}`;

    return {
      invoiceNumber,
      financialYear,
      sequenceNumber,
    };
  }
}
