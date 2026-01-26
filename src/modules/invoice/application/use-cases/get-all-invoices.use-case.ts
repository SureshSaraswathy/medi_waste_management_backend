import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.domain.entity';

@Injectable()
export class GetAllInvoicesUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(filters?: {
    companyId?: string;
    hcfId?: string;
    status?: string;
    financialYear?: string;
    invoiceDateFrom?: string;
    invoiceDateTo?: string;
  }): Promise<Invoice[]> {
    return await this.invoiceRepository.findAll({
      companyId: filters?.companyId,
      hcfId: filters?.hcfId,
      status: filters?.status,
      financialYear: filters?.financialYear,
      invoiceDateFrom: filters?.invoiceDateFrom ? new Date(filters.invoiceDateFrom) : undefined,
      invoiceDateTo: filters?.invoiceDateTo ? new Date(filters.invoiceDateTo) : undefined,
    });
  }
}
