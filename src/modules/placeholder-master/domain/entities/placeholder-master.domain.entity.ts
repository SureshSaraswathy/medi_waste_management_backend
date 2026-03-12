import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

/**
 * Placeholder Master Domain Entity
 */
export class PlaceholderMaster extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly placeholderCode: string,
    public placeholderDescription: string,
    public sourceTable: string,
    public sourceColumn: string,
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
   * Factory method to create a new PlaceholderMaster
   */
  static create(params: {
    placeholderId: string;
    placeholderCode: string;
    placeholderDescription: string;
    sourceTable: string;
    sourceColumn: string;
    createdBy?: string | null;
  }): PlaceholderMaster {
    const now = new Date();
    return new PlaceholderMaster(
      params.placeholderId,
      params.placeholderCode,
      params.placeholderDescription,
      params.sourceTable,
      params.sourceColumn,
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
    placeholderId: string;
    placeholderCode: string;
    placeholderDescription: string;
    sourceTable: string;
    sourceColumn: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): PlaceholderMaster {
    return new PlaceholderMaster(
      data.placeholderId,
      data.placeholderCode,
      data.placeholderDescription,
      data.sourceTable,
      data.sourceColumn,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Update placeholder master details
   */
  update(data: {
    placeholderDescription?: string;
    sourceTable?: string;
    sourceColumn?: string;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.placeholderDescription !== undefined) {
      this.placeholderDescription = data.placeholderDescription;
    }
    if (data.sourceTable !== undefined) {
      this.sourceTable = data.sourceTable;
    }
    if (data.sourceColumn !== undefined) {
      this.sourceColumn = data.sourceColumn;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get placeholderId(): string {
    return this.id;
  }
}
