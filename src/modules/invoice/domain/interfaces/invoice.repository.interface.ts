import { Invoice } from '../entities/invoice.domain.entity';

export const INVOICE_REPOSITORY_TOKEN = 'INVOICE_REPOSITORY';

export interface IInvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
  findById(invoiceId: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  findAll(filters?: {
    companyId?: string;
    hcfId?: string;
    status?: string;
    financialYear?: string;
    invoiceDateFrom?: Date;
    invoiceDateTo?: Date;
  }): Promise<Invoice[]>;
  findLastSequenceForFinancialYear(financialYear: string): Promise<number>;
  findDuplicateInvoice(params: {
    companyId: string;
    hcfId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    billingType: string;
  }): Promise<Invoice | null>;
  findByBatchId(batchId: string): Promise<Invoice[]>;
  delete(invoiceId: string): Promise<void>;
}
