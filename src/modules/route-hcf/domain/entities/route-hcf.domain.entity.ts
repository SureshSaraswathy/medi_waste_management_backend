import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class RouteHcf extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly routeId: string,
    public readonly hcfId: string,
    public readonly companyId: string,
    public sequenceOrder: number | null,
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
    routeHcfId: string;
    routeId: string;
    hcfId: string;
    companyId: string;
    sequenceOrder?: number | null;
    createdBy?: string | null;
  }): RouteHcf {
    const now = new Date();
    return new RouteHcf(
      params.routeHcfId,
      params.routeId,
      params.hcfId,
      params.companyId,
      params.sequenceOrder || null,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    routeHcfId: string;
    routeId: string;
    hcfId: string;
    companyId: string;
    sequenceOrder: number | null;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): RouteHcf {
    return new RouteHcf(
      data.routeHcfId,
      data.routeId,
      data.hcfId,
      data.companyId,
      data.sequenceOrder,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    sequenceOrder?: number | null;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.sequenceOrder !== undefined) {
      (this as any).sequenceOrder = data.sequenceOrder;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get routeHcfId(): string {
    return this.id;
  }
}
