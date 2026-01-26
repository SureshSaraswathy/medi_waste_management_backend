import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class HcfAmendment extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly hcfId: string,
    public amendmentType: string,
    public amendmentDate: string,
    public description: string | null,
    public amendmentStatus: string | null,
    public approvedBy: string | null,
    public approvedDate: string | null,
    masterStatus: MasterStatus,
    createdBy: string | null,
    createdOn: Date,
    modifiedBy: string | null,
    modifiedOn: Date,
    isDeleted: boolean,
  ) {
    super(id, masterStatus, createdBy, createdOn, modifiedBy, modifiedOn, isDeleted);
  }

  static create(params: {
    hcfAmendmentId: string;
    hcfId: string;
    amendmentType: string;
    amendmentDate: string;
    description?: string | null;
    status?: string | null;
    approvedBy?: string | null;
    approvedDate?: string | null;
    createdBy?: string | null;
  }): HcfAmendment {
    const now = new Date();
    return new HcfAmendment(
      params.hcfAmendmentId,
      params.hcfId,
      params.amendmentType,
      params.amendmentDate,
      params.description || null,
      params.status || null,
      params.approvedBy || null,
      params.approvedDate || null,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    hcfAmendmentId: string;
    hcfId: string;
    amendmentType: string;
    amendmentDate: string;
    description: string | null;
    amendmentStatus: string | null;
    approvedBy: string | null;
    approvedDate: string | null;
    masterStatus: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): HcfAmendment {
    return new HcfAmendment(
      data.hcfAmendmentId,
      data.hcfId,
      data.amendmentType,
      data.amendmentDate,
      data.description,
      data.amendmentStatus,
      data.approvedBy,
      data.approvedDate,
      data.masterStatus,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    amendmentType?: string;
    amendmentDate?: string;
    description?: string | null;
    status?: string | null;
    approvedBy?: string | null;
    approvedDate?: string | null;
    masterStatus?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.amendmentType !== undefined) (this as any).amendmentType = data.amendmentType;
    if (data.amendmentDate !== undefined) (this as any).amendmentDate = data.amendmentDate;
    if (data.description !== undefined) (this as any).description = data.description;
    if (data.status !== undefined) (this as any).amendmentStatus = data.status;
    if (data.approvedBy !== undefined) (this as any).approvedBy = data.approvedBy;
    if (data.approvedDate !== undefined) (this as any).approvedDate = data.approvedDate;
    if (data.masterStatus !== undefined) this.status = data.masterStatus;
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get hcfAmendmentId(): string {
    return this.id;
  }
}
