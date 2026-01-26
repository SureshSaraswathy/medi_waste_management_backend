import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Fleet extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly vehicleNum: string,
    public readonly companyId: string,
    public capacity: string | null,
    public vehMake: string | null,
    public vehModel: string | null,
    public mfgYear: string | null,
    public nextFCDate: string | null,
    public pucDateValidUpto: string | null,
    public insuranceValidUpto: string | null,
    public ownerName: string | null,
    public ownerContact: string | null,
    public ownerEmail: string | null,
    public ownerPAN: string | null,
    public ownerAadhaar: string | null,
    public pymtToName: string | null,
    public pymtBankName: string | null,
    public pymtAccNum: string | null,
    public pymtIFSCode: string | null,
    public pymtBranch: string | null,
    public contractAmount: string | null,
    public tdsExemption: boolean,
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
    fleetId: string;
    vehicleNum: string;
    companyId: string;
    capacity?: string | null;
    vehMake?: string | null;
    vehModel?: string | null;
    mfgYear?: string | null;
    nextFCDate?: string | null;
    pucDateValidUpto?: string | null;
    insuranceValidUpto?: string | null;
    ownerName?: string | null;
    ownerContact?: string | null;
    ownerEmail?: string | null;
    ownerPAN?: string | null;
    ownerAadhaar?: string | null;
    pymtToName?: string | null;
    pymtBankName?: string | null;
    pymtAccNum?: string | null;
    pymtIFSCode?: string | null;
    pymtBranch?: string | null;
    contractAmount?: string | null;
    tdsExemption?: boolean;
    createdBy?: string | null;
  }): Fleet {
    const now = new Date();
    return new Fleet(
      params.fleetId,
      params.vehicleNum,
      params.companyId,
      params.capacity || null,
      params.vehMake || null,
      params.vehModel || null,
      params.mfgYear || null,
      params.nextFCDate || null,
      params.pucDateValidUpto || null,
      params.insuranceValidUpto || null,
      params.ownerName || null,
      params.ownerContact || null,
      params.ownerEmail || null,
      params.ownerPAN || null,
      params.ownerAadhaar || null,
      params.pymtToName || null,
      params.pymtBankName || null,
      params.pymtAccNum || null,
      params.pymtIFSCode || null,
      params.pymtBranch || null,
      params.contractAmount || null,
      params.tdsExemption ?? false,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    fleetId: string;
    vehicleNum: string;
    companyId: string;
    capacity: string | null;
    vehMake: string | null;
    vehModel: string | null;
    mfgYear: string | null;
    nextFCDate: string | null;
    pucDateValidUpto: string | null;
    insuranceValidUpto: string | null;
    ownerName: string | null;
    ownerContact: string | null;
    ownerEmail: string | null;
    ownerPAN: string | null;
    ownerAadhaar: string | null;
    pymtToName: string | null;
    pymtBankName: string | null;
    pymtAccNum: string | null;
    pymtIFSCode: string | null;
    pymtBranch: string | null;
    contractAmount: string | null;
    tdsExemption: boolean;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Fleet {
    return new Fleet(
      data.fleetId,
      data.vehicleNum,
      data.companyId,
      data.capacity,
      data.vehMake,
      data.vehModel,
      data.mfgYear,
      data.nextFCDate,
      data.pucDateValidUpto,
      data.insuranceValidUpto,
      data.ownerName,
      data.ownerContact,
      data.ownerEmail,
      data.ownerPAN,
      data.ownerAadhaar,
      data.pymtToName,
      data.pymtBankName,
      data.pymtAccNum,
      data.pymtIFSCode,
      data.pymtBranch,
      data.contractAmount,
      data.tdsExemption,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    capacity?: string | null;
    vehMake?: string | null;
    vehModel?: string | null;
    mfgYear?: string | null;
    nextFCDate?: string | null;
    pucDateValidUpto?: string | null;
    insuranceValidUpto?: string | null;
    ownerName?: string | null;
    ownerContact?: string | null;
    ownerEmail?: string | null;
    ownerPAN?: string | null;
    ownerAadhaar?: string | null;
    pymtToName?: string | null;
    pymtBankName?: string | null;
    pymtAccNum?: string | null;
    pymtIFSCode?: string | null;
    pymtBranch?: string | null;
    contractAmount?: string | null;
    tdsExemption?: boolean;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.capacity !== undefined) (this as any).capacity = data.capacity;
    if (data.vehMake !== undefined) (this as any).vehMake = data.vehMake;
    if (data.vehModel !== undefined) (this as any).vehModel = data.vehModel;
    if (data.mfgYear !== undefined) (this as any).mfgYear = data.mfgYear;
    if (data.nextFCDate !== undefined) (this as any).nextFCDate = data.nextFCDate;
    if (data.pucDateValidUpto !== undefined) (this as any).pucDateValidUpto = data.pucDateValidUpto;
    if (data.insuranceValidUpto !== undefined) (this as any).insuranceValidUpto = data.insuranceValidUpto;
    if (data.ownerName !== undefined) (this as any).ownerName = data.ownerName;
    if (data.ownerContact !== undefined) (this as any).ownerContact = data.ownerContact;
    if (data.ownerEmail !== undefined) (this as any).ownerEmail = data.ownerEmail;
    if (data.ownerPAN !== undefined) (this as any).ownerPAN = data.ownerPAN;
    if (data.ownerAadhaar !== undefined) (this as any).ownerAadhaar = data.ownerAadhaar;
    if (data.pymtToName !== undefined) (this as any).pymtToName = data.pymtToName;
    if (data.pymtBankName !== undefined) (this as any).pymtBankName = data.pymtBankName;
    if (data.pymtAccNum !== undefined) (this as any).pymtAccNum = data.pymtAccNum;
    if (data.pymtIFSCode !== undefined) (this as any).pymtIFSCode = data.pymtIFSCode;
    if (data.pymtBranch !== undefined) (this as any).pymtBranch = data.pymtBranch;
    if (data.contractAmount !== undefined) (this as any).contractAmount = data.contractAmount;
    if (data.tdsExemption !== undefined) (this as any).tdsExemption = data.tdsExemption;
    if (data.status !== undefined) this.status = data.status;
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get fleetId(): string {
    return this.id;
  }
}
