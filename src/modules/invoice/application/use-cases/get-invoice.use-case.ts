import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';
import { InvoiceNotFoundException } from '../../domain/exceptions/invoice.exceptions';

@Injectable()
export class GetInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException(invoiceId);
    }
    return invoice;
  }
}
