export interface InvoiceReportItemDto {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  billingType: string;
  invoiceValue: number;
  totalPaidAmount: number;
  balanceAmount: number;
  status: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  hcfId: string;
  hcfName: string;
  hcfCode: string;
}

export interface InvoiceReportMetaDto {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  state: 'NO_FILTER' | 'NO_RESULTS' | 'HAS_RESULTS';
}

export interface InvoiceReportResponseDto {
  data: InvoiceReportItemDto[];
  meta: InvoiceReportMetaDto;
}
