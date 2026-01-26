export class FinBalanceResponseDto {
  finBalanceId: string;
  companyId: string;
  companyName?: string;
  companyCode?: string;
  hcfId: string;
  hcfCode?: string;
  hcfName?: string;
  openingBalance: number;
  currentBalance: number;
  isManual: boolean;
  notes: string | null;
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
