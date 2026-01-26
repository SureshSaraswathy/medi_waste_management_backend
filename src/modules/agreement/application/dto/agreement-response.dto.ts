export class AgreementResponseDto {
  id: string;
  agreementID: string;
  agreementNum: string;
  contractId: string;
  agreementDate: string;
  status: 'Draft' | 'Generated' | 'Signed';
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
