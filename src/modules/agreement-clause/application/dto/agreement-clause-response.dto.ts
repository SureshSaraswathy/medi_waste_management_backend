export class AgreementClauseResponseDto {
  id: string;
  agreementClauseID: string;
  agreementId: string;
  pointNum: string;
  pointTitle: string;
  pointText: string;
  sequenceNo: number;
  status: 'Active' | 'Inactive';
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
