import { CollectionStatus, WasteColor } from '../../infrastructure/transaction/waste-collection.entity';

export class WasteCollection {
  private constructor(
    public readonly id: string,
    public readonly barcode: string,
    public readonly collectionDate: Date,
    public readonly companyId: string,
    public readonly hcfId: string,
    public readonly wasteColor: WasteColor,
    public weightKg: number | null,
    public status: CollectionStatus,
    public readonly routeAssignmentId: string | null,
    public collectedBy: string | null,
    public collectedAt: Date | null,
    public notes: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    wasteCollectionId: string;
    barcode: string;
    collectionDate: Date;
    companyId: string;
    hcfId: string;
    wasteColor: WasteColor;
    weightKg?: number | null;
    status?: CollectionStatus;
    routeAssignmentId?: string | null;
    collectedBy?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  }): WasteCollection {
    const now = new Date();
    return new WasteCollection(
      params.wasteCollectionId,
      params.barcode,
      params.collectionDate,
      params.companyId,
      params.hcfId,
      params.wasteColor,
      params.weightKg || null,
      params.status || CollectionStatus.PENDING,
      params.routeAssignmentId || null,
      params.collectedBy || null,
      null,
      params.notes || null,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    wasteCollectionId: string;
    barcode: string;
    collectionDate: Date;
    companyId: string;
    hcfId: string;
    wasteColor: WasteColor;
    weightKg: number | null;
    status: CollectionStatus;
    routeAssignmentId: string | null;
    collectedBy: string | null;
    collectedAt: Date | null;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): WasteCollection {
    return new WasteCollection(
      data.wasteCollectionId,
      data.barcode,
      data.collectionDate,
      data.companyId,
      data.hcfId,
      data.wasteColor,
      data.weightKg,
      data.status,
      data.routeAssignmentId,
      data.collectedBy,
      data.collectedAt,
      data.notes,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(params: {
    weightKg?: number | null;
    status?: CollectionStatus;
    collectedBy?: string | null;
    collectedAt?: Date | null;
    notes?: string | null;
    modifiedBy?: string | null;
  }): void {
    if (params.weightKg !== undefined) {
      this.weightKg = params.weightKg;
    }
    if (params.status !== undefined) {
      this.status = params.status;
    }
    if (params.collectedBy !== undefined) {
      (this as any).collectedBy = params.collectedBy;
    }
    if (params.collectedAt !== undefined) {
      (this as any).collectedAt = params.collectedAt;
    }
    if (params.notes !== undefined) {
      this.notes = params.notes;
    }
    this.modifiedBy = params.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  markAsCollected(collectedBy: string, weightKg: number): void {
    this.update({
      status: CollectionStatus.COLLECTED,
      collectedBy,
      collectedAt: new Date(),
      weightKg,
      modifiedBy: collectedBy,
    });
  }

  canEdit(): boolean {
    return this.status === CollectionStatus.PENDING || this.status === CollectionStatus.COLLECTED;
  }

  get wasteCollectionId(): string {
    return this.id;
  }
}
