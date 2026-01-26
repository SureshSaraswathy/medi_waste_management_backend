import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class TrainingCertificate extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly certificateNo: string,
    public readonly staffName: string,
    public readonly staffCode: string,
    public readonly designation: string,
    public readonly hcfId: string,
    public readonly trainingDate: Date,
    public readonly companyId: string,
    public readonly trainedBy: string,
    status: MasterStatus,
    createdBy: string | null,
    createdOn: Date,
    modifiedBy: string | null,
    modifiedOn: Date,
    isDeleted: boolean,
  ) {
    super(id, status, createdBy, createdOn, modifiedBy, modifiedOn, isDeleted);
  }

  static create(params: {
    certificateId: string;
    certificateNo: string;
    staffName: string;
    staffCode: string;
    designation: string;
    hcfId: string;
    trainingDate: Date;
    companyId: string;
    trainedBy: string;
    createdBy?: string | null;
  }): TrainingCertificate {
    const now = new Date();
    return new TrainingCertificate(
      params.certificateId,
      params.certificateNo,
      params.staffName,
      params.staffCode,
      params.designation,
      params.hcfId,
      params.trainingDate,
      params.companyId,
      params.trainedBy,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    certificateId: string;
    certificateNo: string;
    staffName: string;
    staffCode: string;
    designation: string;
    hcfId: string;
    trainingDate: Date;
    companyId: string;
    trainedBy: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): TrainingCertificate {
    return new TrainingCertificate(
      data.certificateId,
      data.certificateNo,
      data.staffName,
      data.staffCode,
      data.designation,
      data.hcfId,
      data.trainingDate,
      data.companyId,
      data.trainedBy,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    staffName?: string;
    staffCode?: string;
    designation?: string;
    hcfId?: string;
    trainingDate?: Date;
    trainedBy?: string;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    // Note: certificateNo, companyId are immutable after creation
    if (data.staffName !== undefined) {
      (this as any).staffName = data.staffName;
    }
    if (data.staffCode !== undefined) {
      (this as any).staffCode = data.staffCode;
    }
    if (data.designation !== undefined) {
      (this as any).designation = data.designation;
    }
    if (data.hcfId !== undefined) {
      (this as any).hcfId = data.hcfId;
    }
    if (data.trainingDate !== undefined) {
      (this as any).trainingDate = data.trainingDate;
    }
    if (data.trainedBy !== undefined) {
      (this as any).trainedBy = data.trainedBy;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get certificateId(): string {
    return this.id;
  }
}
