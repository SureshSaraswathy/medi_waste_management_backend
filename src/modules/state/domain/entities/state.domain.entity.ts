import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

/**
 * State Domain Entity
 */
export class State extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly stateCode: string,
    public readonly stateName: string,
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
   * Factory method to create a new State
   */
  static create(params: {
    stateId: string;
    stateCode: string;
    stateName: string;
    createdBy?: string | null;
  }): State {
    const now = new Date();
    return new State(
      params.stateId,
      params.stateCode,
      params.stateName,
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
    stateId: string;
    stateCode: string;
    stateName: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): State {
    return new State(
      data.stateId,
      data.stateCode,
      data.stateName,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Update state details
   */
  update(data: {
    stateCode?: string;
    stateName?: string;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    // Note: stateCode and stateName are readonly, so we can't update them
    // If you need to update them, you'll need to make them mutable or create a new entity
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get stateId(): string {
    return this.id;
  }
}
