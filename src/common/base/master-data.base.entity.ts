/**
 * Base Domain Entity for Master Data
 * Provides common fields and behavior for all master data entities
 */
export enum MasterStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export abstract class BaseMasterEntity {
  protected constructor(
    public readonly id: string,
    public status: MasterStatus,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  /**
   * Activate the master record
   */
  activate(modifiedBy?: string | null): void {
    this.status = MasterStatus.ACTIVE;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Deactivate the master record
   */
  deactivate(modifiedBy?: string | null): void {
    this.status = MasterStatus.INACTIVE;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Soft delete the master record
   */
  softDelete(modifiedBy?: string | null): void {
    this.isDeleted = true;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Check if record is active
   */
  isActive(): boolean {
    return this.status === MasterStatus.ACTIVE && !this.isDeleted;
  }
}
