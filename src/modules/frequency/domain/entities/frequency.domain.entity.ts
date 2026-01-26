import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Frequency extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly frequencyCode: string,
    public readonly frequencyName: string,
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
    frequencyId: string;
    frequencyCode: string;
    frequencyName: string;
    companyId: string;
    createdBy?: string | null;
  }): Frequency {
    const now = new Date();
    return new Frequency(
      params.frequencyId,
      params.frequencyCode,
      params.frequencyName,
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
    frequencyId: string;
    frequencyCode: string;
    frequencyName: string;
    companyId: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Frequency {
    return new Frequency(
      data.frequencyId,
      data.frequencyCode,
      data.frequencyName,
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

  get frequencyId(): string {
    return this.id;
  }
}
