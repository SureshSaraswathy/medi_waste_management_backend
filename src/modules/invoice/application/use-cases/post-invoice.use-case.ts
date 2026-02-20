import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { InvoiceNotFoundException } from '../../domain/exceptions/invoice.exceptions';
import { InvoiceStatus } from '../../infrastructure/transaction/invoice.entity';
import { InvoiceNumberService } from '../services/invoice-number.service';
import { InvoicePdfService } from '../services/invoice-pdf.service';

@Injectable()
export class PostInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  async execute(invoiceId: string, invoiceDate: Date, modifiedBy?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(`Invoice is not in DRAFT status. Current status: ${invoice.status}`);
    }

    // Generate invoice number if not already set
    if (!invoice.invoiceNumber || invoice.invoiceNumber === '') {
      const { invoiceNumber, financialYear, sequenceNumber } = await this.invoiceNumberService.generateInvoiceNumber(invoiceDate);
      (invoice as any).invoiceNumber = invoiceNumber;
      (invoice as any).financialYear = financialYear;
      (invoice as any).sequenceNumber = sequenceNumber;
    }

    // Update invoice date if provided
    if (invoiceDate) {
      invoice.invoiceDate = invoiceDate;
    }

    // Post the invoice (change status to DUE)
    invoice.post();
    (invoice as any).modifiedBy = modifiedBy || null;

    const savedInvoice = await this.invoiceRepository.update(invoice);

    // Generate PDF
    try {
      await this.invoicePdfService.generateInvoicePdf(savedInvoice.invoiceId);
    } catch (error) {
      // Log error but don't fail the invoice posting
      console.error(`Failed to generate PDF for invoice ${savedInvoice.invoiceId}:`, error);
    }

    return savedInvoice;
  }
}
