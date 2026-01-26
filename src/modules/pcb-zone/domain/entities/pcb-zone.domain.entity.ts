import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class PcbZone extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly pcbZoneName: string,
    public readonly pcbZoneAddress: string,
    public readonly contactNum: string,
    public readonly contactEmail: string,
    public readonly alertEmail: string,
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
    pcbZoneId: string;
    pcbZoneName: string;
    pcbZoneAddress: string;
    contactNum: string;
    contactEmail: string;
    alertEmail: string;
    createdBy?: string | null;
  }): PcbZone {
    const now = new Date();
    return new PcbZone(
      params.pcbZoneId,
      params.pcbZoneName,
      params.pcbZoneAddress,
      params.contactNum,
      params.contactEmail,
      params.alertEmail,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    pcbZoneId: string;
    pcbZoneName: string;
    pcbZoneAddress: string;
    contactNum: string;
    contactEmail: string;
    alertEmail: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): PcbZone {
    return new PcbZone(
      data.pcbZoneId,
      data.pcbZoneName,
      data.pcbZoneAddress,
      data.contactNum,
      data.contactEmail,
      data.alertEmail,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    pcbZoneAddress?: string;
    contactNum?: string;
    contactEmail?: string;
    alertEmail?: string;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.pcbZoneAddress !== undefined) {
      (this as any).pcbZoneAddress = data.pcbZoneAddress;
    }
    if (data.contactNum !== undefined) {
      (this as any).contactNum = data.contactNum;
    }
    if (data.contactEmail !== undefined) {
      (this as any).contactEmail = data.contactEmail;
    }
    if (data.alertEmail !== undefined) {
      (this as any).alertEmail = data.alertEmail;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get pcbZoneId(): string {
    return this.id;
  }
}
