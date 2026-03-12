export class ContractResponseDto {
  id: string;
  contractID: string;
  contractNum: string;
  companyId: string;
  hcfId: string;
  agreementTemplateId: string | null;
  startDate: string;
  endDate: string;
  billingType: 'Bed' | 'Kg' | 'Lumpsum';
  status: 'Draft' | 'Active' | 'Expired';
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
