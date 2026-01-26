import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Color extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly colorName: string,
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
    colorId: string;
    colorName: string;
    companyId: string;
    createdBy?: string | null;
  }): Color {
    const now = new Date();
    return new Color(
      params.colorId,
      params.colorName,
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
    colorId: string;
    colorName: string;
    companyId: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Color {
    return new Color(
      data.colorId,
      data.colorName,
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

  get colorId(): string {
    return this.id;
  }
}
