export interface HcfLedgerStatementRowDto {
  date: string;
  particulars: string;
  invoiceAmountDr: number | null;
  receiptAmountCr: number | null;
  rowType: 'opening' | 'invoice' | 'receipt' | 'total' | 'balance';
}

export interface HcfLedgerStatementResponseDto {
  header: {
    hcfId: string;
    hcfName: string;
    fromDate: string;
    toDate: string;
  };
  rows: HcfLedgerStatementRowDto[];
  totals: {
    totalDr: number;
    totalCr: number;
    balanceReceivable: number;
  };
  meta: {
    totalRecords: number;
    hcfOptions: Array<{ hcfId: string; hcfName: string }>;
  };
}

