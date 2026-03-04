import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

/**
 * District Domain Entity
 */
export class District extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly districtCode: string,
    public readonly districtName: string,
    public stateId: string | null,
    status: MasterStatus,
    createdBy: string | null,
    createdOn: Date,
    modifiedBy: string | null,
    modifiedOn: Date,
    isDeleted: boolean,
  ) {
    super(id, status, createdBy, createdOn, modifiedBy, modifiedOn, isDeleted);
  }

  /**
   * Factory method to create a new District
   */
  static create(params: {
    districtId: string;
    districtCode: string;
    districtName: string;
    stateId?: string | null;
    createdBy?: string | null;
  }): District {
    const now = new Date();
    return new District(
      params.districtId,
      params.districtCode,
      params.districtName,
      params.stateId || null,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(data: {
    districtId: string;
    districtCode: string;
    districtName: string;
    stateId: string | null;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): District {
    return new District(
      data.districtId,
      data.districtCode,
      data.districtName,
      data.stateId,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Update district details
   */
  update(data: {
    stateId?: string | null;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    // Note: districtCode and districtName are readonly, so we can't update them
    // If you need to update them, you'll need to make them mutable or create a new entity
    if (data.stateId !== undefined) {
      this.stateId = data.stateId;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get districtId(): string {
    return this.id;
  }
}
