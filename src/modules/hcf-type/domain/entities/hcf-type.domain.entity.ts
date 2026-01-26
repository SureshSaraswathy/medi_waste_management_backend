import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class HcfType extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly hcfTypeCode: string,
    public readonly hcfTypeName: string,
    public readonly companyId: string,
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
    hcfTypeId: string;
    hcfTypeCode: string;
    hcfTypeName: string;
    companyId: string;
    createdBy?: string | null;
  }): HcfType {
    const now = new Date();
    return new HcfType(
      params.hcfTypeId,
      params.hcfTypeCode,
      params.hcfTypeName,
      params.companyId,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    hcfTypeId: string;
    hcfTypeCode: string;
    hcfTypeName: string;
    companyId: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): HcfType {
    return new HcfType(
      data.hcfTypeId,
      data.hcfTypeCode,
      data.hcfTypeName,
      data.companyId,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get hcfTypeId(): string {
    return this.id;
  }
}
