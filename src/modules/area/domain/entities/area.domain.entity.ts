import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Area extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly areaCode: string,
    public readonly areaName: string,
    public readonly areaPincode: string,
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
    areaId: string;
    areaCode: string;
    areaName: string;
    areaPincode: string;
    createdBy?: string | null;
  }): Area {
    const now = new Date();
    return new Area(
      params.areaId,
      params.areaCode,
      params.areaName,
      params.areaPincode,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    areaId: string;
    areaCode: string;
    areaName: string;
    areaPincode: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Area {
    return new Area(
      data.areaId,
      data.areaCode,
      data.areaName,
      data.areaPincode,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    areaPincode?: string;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    // Note: areaCode and areaName are readonly
    if (data.areaPincode !== undefined) {
      (this as any).areaPincode = data.areaPincode;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get areaId(): string {
    return this.id;
  }
}
