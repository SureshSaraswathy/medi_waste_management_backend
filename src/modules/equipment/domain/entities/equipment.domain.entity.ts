import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

/**
 * Equipment Domain Entity
 */
export class Equipment extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly companyId: string,
    public readonly equipmentCode: string,
    public readonly equipmentName: string,
    public equipmentType: string | null,
    public make: string | null,
    public capacity: string | null,
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
   * Factory method to create a new Equipment
   */
  static create(params: {
    equipmentId: string;
    companyId: string;
    equipmentCode: string;
    equipmentName: string;
    equipmentType?: string | null;
    make?: string | null;
    capacity?: string | null;
    createdBy?: string | null;
  }): Equipment {
    const now = new Date();
    return new Equipment(
      params.equipmentId,
      params.companyId,
      params.equipmentCode,
      params.equipmentName,
      params.equipmentType || null,
      params.make || null,
      params.capacity || null,
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
    equipmentId: string;
    companyId: string;
    equipmentCode: string;
    equipmentName: string;
    equipmentType: string | null;
    make: string | null;
    capacity: string | null;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Equipment {
    return new Equipment(
      data.equipmentId,
      data.companyId,
      data.equipmentCode,
      data.equipmentName,
      data.equipmentType,
      data.make,
      data.capacity,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Update equipment details
   */
  update(data: {
    companyId?: string;
    equipmentType?: string | null;
    make?: string | null;
    capacity?: string | null;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    // Note: equipmentCode and equipmentName are readonly, so we can't update them
    if (data.companyId !== undefined) {
      (this as any).companyId = data.companyId;
    }
    if (data.equipmentType !== undefined) {
      this.equipmentType = data.equipmentType;
    }
    if (data.make !== undefined) {
      this.make = data.make;
    }
    if (data.capacity !== undefined) {
      this.capacity = data.capacity;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get equipmentId(): string {
    return this.id;
  }
}
