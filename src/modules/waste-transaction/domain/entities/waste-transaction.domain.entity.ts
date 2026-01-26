import {
  TransactionStatus,
  SegregationQuality,
} from '../../infrastructure/transaction/waste-transaction.entity';

export class WasteTransaction {
  private constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly hcfId: string,
    public readonly pickupDate: Date,
    public readonly isNilPickup: boolean,
    public readonly yellowBagCount: number,
    public readonly redBagCount: number,
    public readonly whiteBagCount: number,
    public readonly blueBagCount: number,
    public readonly yellowWeightKg: number | null,
    public readonly redWeightKg: number | null,
    public readonly whiteWeightKg: number | null,
    public readonly blueWeightKg: number | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly segregationQuality: SegregationQuality | null,
    public readonly status: TransactionStatus,
    public readonly notes: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly verifiedBy: string | null,
    public readonly verifiedOn: Date | null,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    wasteTransactionId: string;
    companyId: string;
    hcfId: string;
    pickupDate: Date;
    isNilPickup: boolean;
    yellowBagCount: number;
    redBagCount: number;
    whiteBagCount: number;
    blueBagCount?: number;
    yellowWeightKg?: number | null;
    redWeightKg?: number | null;
    whiteWeightKg?: number | null;
    blueWeightKg?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    segregationQuality?: SegregationQuality | null;
    notes?: string | null;
    createdBy?: string | null;
  }): WasteTransaction {
    const now = new Date();
    return new WasteTransaction(
      params.wasteTransactionId,
      params.companyId,
      params.hcfId,
      params.pickupDate,
      params.isNilPickup,
      params.yellowBagCount,
      params.redBagCount,
      params.whiteBagCount,
      params.blueBagCount ?? 0,
      params.yellowWeightKg ?? null,
      params.redWeightKg ?? null,
      params.whiteWeightKg ?? null,
      params.blueWeightKg ?? null,
      params.latitude ?? null,
      params.longitude ?? null,
      params.segregationQuality ?? null,
      TransactionStatus.DRAFT,
      params.notes ?? null,
      params.createdBy || null,
      now,
      null,
      now,
      null,
      null,
      false,
    );
  }

  static reconstitute(data: {
    wasteTransactionId: string;
    companyId: string;
    hcfId: string;
    pickupDate: Date;
    isNilPickup: boolean;
    yellowBagCount: number;
    redBagCount: number;
    whiteBagCount: number;
    blueBagCount: number;
    yellowWeightKg: number | null;
    redWeightKg: number | null;
    whiteWeightKg: number | null;
    blueWeightKg: number | null;
    latitude: number | null;
    longitude: number | null;
    segregationQuality: SegregationQuality | null;
    status: TransactionStatus;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    verifiedBy: string | null;
    verifiedOn: Date | null;
    isDeleted: boolean;
  }): WasteTransaction {
    return new WasteTransaction(
      data.wasteTransactionId,
      data.companyId,
      data.hcfId,
      data.pickupDate,
      data.isNilPickup,
      data.yellowBagCount,
      data.redBagCount,
      data.whiteBagCount,
      data.blueBagCount,
      data.yellowWeightKg,
      data.redWeightKg,
      data.whiteWeightKg,
      data.blueWeightKg,
      data.latitude,
      data.longitude,
      data.segregationQuality,
      data.status,
      data.notes,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.verifiedBy,
      data.verifiedOn,
      data.isDeleted,
    );
  }

  submit(modifiedBy: string | null): WasteTransaction {
    if (this.status !== TransactionStatus.DRAFT) {
      throw new Error('Only draft transactions can be submitted');
    }
    return new WasteTransaction(
      this.id,
      this.companyId,
      this.hcfId,
      this.pickupDate,
      this.isNilPickup,
      this.yellowBagCount,
      this.redBagCount,
      this.whiteBagCount,
      this.blueBagCount,
      this.yellowWeightKg,
      this.redWeightKg,
      this.whiteWeightKg,
      this.blueWeightKg,
      this.latitude,
      this.longitude,
      this.segregationQuality,
      TransactionStatus.SUBMITTED,
      this.notes,
      this.createdBy,
      this.createdOn,
      modifiedBy,
      new Date(),
      this.verifiedBy,
      this.verifiedOn,
      this.isDeleted,
    );
  }

  verify(verifiedBy: string): WasteTransaction {
    if (this.status !== TransactionStatus.SUBMITTED) {
      throw new Error('Only submitted transactions can be verified');
    }
    return new WasteTransaction(
      this.id,
      this.companyId,
      this.hcfId,
      this.pickupDate,
      this.isNilPickup,
      this.yellowBagCount,
      this.redBagCount,
      this.whiteBagCount,
      this.blueBagCount,
      this.yellowWeightKg,
      this.redWeightKg,
      this.whiteWeightKg,
      this.blueWeightKg,
      this.latitude,
      this.longitude,
      this.segregationQuality,
      TransactionStatus.VERIFIED,
      this.notes,
      this.createdBy,
      this.createdOn,
      this.modifiedBy,
      this.modifiedOn,
      verifiedBy,
      new Date(),
      this.isDeleted,
    );
  }

  update(params: {
    pickupDate?: Date;
    isNilPickup?: boolean;
    yellowBagCount?: number;
    redBagCount?: number;
    whiteBagCount?: number;
    blueBagCount?: number;
    yellowWeightKg?: number | null;
    redWeightKg?: number | null;
    whiteWeightKg?: number | null;
    blueWeightKg?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    segregationQuality?: SegregationQuality | null;
    notes?: string | null;
    modifiedBy?: string | null;
  }): WasteTransaction {
    if (this.status !== TransactionStatus.DRAFT) {
      throw new Error('Only draft transactions can be updated');
    }
    return new WasteTransaction(
      this.id,
      this.companyId,
      this.hcfId,
      params.pickupDate ?? this.pickupDate,
      params.isNilPickup ?? this.isNilPickup,
      params.yellowBagCount ?? this.yellowBagCount,
      params.redBagCount ?? this.redBagCount,
      params.whiteBagCount ?? this.whiteBagCount,
      params.blueBagCount ?? this.blueBagCount,
      params.yellowWeightKg !== undefined ? params.yellowWeightKg : this.yellowWeightKg,
      params.redWeightKg !== undefined ? params.redWeightKg : this.redWeightKg,
      params.whiteWeightKg !== undefined ? params.whiteWeightKg : this.whiteWeightKg,
      params.blueWeightKg !== undefined ? params.blueWeightKg : this.blueWeightKg,
      params.latitude !== undefined ? params.latitude : this.latitude,
      params.longitude !== undefined ? params.longitude : this.longitude,
      params.segregationQuality !== undefined ? params.segregationQuality : this.segregationQuality,
      this.status,
      params.notes !== undefined ? params.notes : this.notes,
      this.createdBy,
      this.createdOn,
      params.modifiedBy ?? this.modifiedBy,
      new Date(),
      this.verifiedBy,
      this.verifiedOn,
      this.isDeleted,
    );
  }

  get wasteTransactionId(): string {
    return this.id;
  }
}
