export class TrainingCertificateResponseDto {
  id: string;
  certificateNo: string;
  staffName: string;
  staffCode: string;
  designation: string;
  hcfId: string;
  trainingDate: string;
  companyId: string;
  trainedBy: string;
  status: 'Active' | 'Inactive';
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
