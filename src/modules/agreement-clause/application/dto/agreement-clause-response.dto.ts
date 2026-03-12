export class AgreementClauseResponseDto {
  id: string;
  agreementClauseID: string;
  agreementTemplateId: string;
  agreementTemplateName?: string; // Added for frontend display
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
