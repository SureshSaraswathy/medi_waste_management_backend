import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Route extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly routeCode: string,
    public readonly routeName: string,
    public readonly companyId: string,
    public frequencyId: string | null,
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
    routeId: string;
    routeCode: string;
    routeName: string;
    companyId: string;
    frequencyId?: string | null;
    createdBy?: string | null;
  }): Route {
    const now = new Date();
    return new Route(
      params.routeId,
      params.routeCode,
      params.routeName,
      params.companyId,
      params.frequencyId || null,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    routeId: string;
    routeCode: string;
    routeName: string;
    companyId: string;
    frequencyId: string | null;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Route {
    return new Route(
      data.routeId,
      data.routeCode,
      data.routeName,
      data.companyId,
      data.frequencyId,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    frequencyId?: string | null;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.frequencyId !== undefined) {
      (this as any).frequencyId = data.frequencyId;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get routeId(): string {
    return this.id;
  }
}
