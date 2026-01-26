import {
  WasteProcessStatus,
} from '../../infrastructure/transaction/waste-process.entity';

export class WasteProcess {
  private constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly processDate: Date,
    public readonly incinerationWeightKg: number,
    public readonly autoclaveWeightKg: number,
    public readonly status: WasteProcessStatus,
    public readonly notes: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly verifiedBy: string | null,
    public readonly verifiedOn: Date | null,
    public readonly closedBy: string | null,
    public readonly closedOn: Date | null,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    wasteProcessId: string;
    companyId: string;
    processDate: Date;
    incinerationWeightKg: number;
    autoclaveWeightKg: number;
    notes?: string | null;
    createdBy?: string | null;
  }): WasteProcess {
    const now = new Date();
    return new WasteProcess(
      params.wasteProcessId,
      params.companyId,
      params.processDate,
      params.incinerationWeightKg,
      params.autoclaveWeightKg,
      WasteProcessStatus.DRAFT,
      params.notes ?? null,
      params.createdBy || null,
      now,
      null,
      now,
      null,
      null,
      null,
      null,
      false,
    );
  }

  static reconstitute(data: {
    wasteProcessId: string;
    companyId: string;
    processDate: Date;
    incinerationWeightKg: number;
    autoclaveWeightKg: number;
    status: WasteProcessStatus;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    verifiedBy: string | null;
    verifiedOn: Date | null;
    closedBy: string | null;
    closedOn: Date | null;
    isDeleted: boolean;
  }): WasteProcess {
    return new WasteProcess(
      data.wasteProcessId,
      data.companyId,
      data.processDate,
      data.incinerationWeightKg,
      data.autoclaveWeightKg,
      data.status,
      data.notes,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.verifiedBy,
      data.verifiedOn,
      data.closedBy,
      data.closedOn,
      data.isDeleted,
    );
  }

  submit(modifiedBy: string | null): WasteProcess {
    if (this.status !== WasteProcessStatus.DRAFT) {
      throw new Error('Only draft processes can be submitted');
    }
    return new WasteProcess(
      this.id,
      this.companyId,
      this.processDate,
      this.incinerationWeightKg,
      this.autoclaveWeightKg,
      WasteProcessStatus.SUBMITTED,
      this.notes,
      this.createdBy,
      this.createdOn,
      modifiedBy,
      new Date(),
      this.verifiedBy,
      this.verifiedOn,
      this.closedBy,
      this.closedOn,
      this.isDeleted,
    );
  }

  verify(verifiedBy: string): WasteProcess {
    if (this.status !== WasteProcessStatus.SUBMITTED) {
      throw new Error('Only submitted processes can be verified');
    }
    return new WasteProcess(
      this.id,
      this.companyId,
      this.processDate,
      this.incinerationWeightKg,
      this.autoclaveWeightKg,
      WasteProcessStatus.VERIFIED,
      this.notes,
      this.createdBy,
      this.createdOn,
      this.modifiedBy,
      this.modifiedOn,
      verifiedBy,
      new Date(),
      this.closedBy,
      this.closedOn,
      this.isDeleted,
    );
  }

  close(closedBy: string): WasteProcess {
    if (this.status !== WasteProcessStatus.VERIFIED) {
      throw new Error('Only verified processes can be closed');
    }
    return new WasteProcess(
      this.id,
      this.companyId,
      this.processDate,
      this.incinerationWeightKg,
      this.autoclaveWeightKg,
      WasteProcessStatus.CLOSED,
      this.notes,
      this.createdBy,
      this.createdOn,
      this.modifiedBy,
      this.modifiedOn,
      this.verifiedBy,
      this.verifiedOn,
      closedBy,
      new Date(),
      this.isDeleted,
    );
  }

  update(params: {
    incinerationWeightKg?: number;
    autoclaveWeightKg?: number;
    notes?: string | null;
    modifiedBy?: string | null;
  }): WasteProcess {
    if (this.status !== WasteProcessStatus.DRAFT) {
      throw new Error('Only draft processes can be updated');
    }
    return new WasteProcess(
      this.id,
      this.companyId,
      this.processDate,
      params.incinerationWeightKg ?? this.incinerationWeightKg,
      params.autoclaveWeightKg ?? this.autoclaveWeightKg,
      this.status,
      params.notes !== undefined ? params.notes : this.notes,
      this.createdBy,
      this.createdOn,
      params.modifiedBy ?? this.modifiedBy,
      new Date(),
      this.verifiedBy,
      this.verifiedOn,
      this.closedBy,
      this.closedOn,
      this.isDeleted,
    );
  }

  get wasteProcessId(): string {
    return this.id;
  }
}
