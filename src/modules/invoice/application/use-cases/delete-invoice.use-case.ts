import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { InvoiceNotFoundException, InvoiceLockedException } from '../../domain/exceptions/invoice.exceptions';

@Injectable()
export class DeleteInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }

    if (invoice.isLocked) {
      throw new InvoiceLockedException('Locked invoice cannot be deleted');
    }

    await this.invoiceRepository.delete(invoiceId);
  }
}
