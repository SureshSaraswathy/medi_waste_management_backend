import {
  VehicleWasteCollectionStatus,
} from '../../infrastructure/transaction/vehicle-waste-collection.entity';

export class VehicleWasteCollection {
  private constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly collectionDate: Date,
    public readonly grossWeightKg: number,
    public readonly tareWeightKg: number,
    public readonly netWeightKg: number,
    public readonly incinerationWeightKg: number,
    public readonly autoclaveWeightKg: number,
    public readonly vehicleKm: number | null,
    public readonly fuelUsageLiters: number | null,
    public readonly status: VehicleWasteCollectionStatus,
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
    vehicleWasteCollectionId: string;
    vehicleId: string;
    collectionDate: Date;
    grossWeightKg: number;
    tareWeightKg: number;
    netWeightKg: number;
    incinerationWeightKg: number;
    autoclaveWeightKg: number;
    vehicleKm?: number | null;
    fuelUsageLiters?: number | null;
    notes?: string | null;
    createdBy?: string | null;
  }): VehicleWasteCollection {
    const now = new Date();
    return new VehicleWasteCollection(
      params.vehicleWasteCollectionId,
      params.vehicleId,
      params.collectionDate,
      params.grossWeightKg,
      params.tareWeightKg,
      params.netWeightKg,
      params.incinerationWeightKg,
      params.autoclaveWeightKg,
      params.vehicleKm ?? null,
      params.fuelUsageLiters ?? null,
      VehicleWasteCollectionStatus.DRAFT,
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
    vehicleWasteCollectionId: string;
    vehicleId: string;
    collectionDate: Date;
    grossWeightKg: number;
    tareWeightKg: number;
    netWeightKg: number;
    incinerationWeightKg: number;
    autoclaveWeightKg: number;
    vehicleKm: number | null;
    fuelUsageLiters: number | null;
    status: VehicleWasteCollectionStatus;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    verifiedBy: string | null;
    verifiedOn: Date | null;
    isDeleted: boolean;
  }): VehicleWasteCollection {
    return new VehicleWasteCollection(
      data.vehicleWasteCollectionId,
      data.vehicleId,
      data.collectionDate,
      data.grossWeightKg,
      data.tareWeightKg,
      data.netWeightKg,
      data.incinerationWeightKg,
      data.autoclaveWeightKg,
      data.vehicleKm,
      data.fuelUsageLiters,
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

  submit(modifiedBy: string | null): VehicleWasteCollection {
    if (this.status !== VehicleWasteCollectionStatus.DRAFT) {
      throw new Error('Only draft collections can be submitted');
    }
    return new VehicleWasteCollection(
      this.id,
      this.vehicleId,
      this.collectionDate,
      this.grossWeightKg,
      this.tareWeightKg,
      this.netWeightKg,
      this.incinerationWeightKg,
      this.autoclaveWeightKg,
      this.vehicleKm,
      this.fuelUsageLiters,
      VehicleWasteCollectionStatus.SUBMITTED,
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

  verify(verifiedBy: string): VehicleWasteCollection {
    if (this.status !== VehicleWasteCollectionStatus.SUBMITTED) {
      throw new Error('Only submitted collections can be verified');
    }
    return new VehicleWasteCollection(
      this.id,
      this.vehicleId,
      this.collectionDate,
      this.grossWeightKg,
      this.tareWeightKg,
      this.netWeightKg,
      this.incinerationWeightKg,
      this.autoclaveWeightKg,
      this.vehicleKm,
      this.fuelUsageLiters,
      VehicleWasteCollectionStatus.VERIFIED,
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
    grossWeightKg?: number;
    tareWeightKg?: number;
    netWeightKg?: number;
    incinerationWeightKg?: number;
    autoclaveWeightKg?: number;
    vehicleKm?: number | null;
    fuelUsageLiters?: number | null;
    notes?: string | null;
    modifiedBy?: string | null;
  }): VehicleWasteCollection {
    if (this.status !== VehicleWasteCollectionStatus.DRAFT) {
      throw new Error('Only draft collections can be updated');
    }
    return new VehicleWasteCollection(
      this.id,
      this.vehicleId,
      this.collectionDate,
      params.grossWeightKg ?? this.grossWeightKg,
      params.tareWeightKg ?? this.tareWeightKg,
      params.netWeightKg ?? this.netWeightKg,
      params.incinerationWeightKg ?? this.incinerationWeightKg,
      params.autoclaveWeightKg ?? this.autoclaveWeightKg,
      params.vehicleKm !== undefined ? params.vehicleKm : this.vehicleKm,
      params.fuelUsageLiters !== undefined ? params.fuelUsageLiters : this.fuelUsageLiters,
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

  get vehicleWasteCollectionId(): string {
    return this.id;
  }
}
