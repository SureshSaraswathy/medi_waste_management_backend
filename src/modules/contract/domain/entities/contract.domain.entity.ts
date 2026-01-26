export class Contract {
  private constructor(
    public readonly contractId: string,
    public readonly contractID: string,
    public readonly contractNum: string,
    public readonly companyId: string,
    public readonly hcfId: string,
    public startDate: Date,
    public endDate: Date,
    public billingType: 'Bed' | 'Kg' | 'Lumpsum',
    public status: 'Draft' | 'Active' | 'Expired',
    public createdBy: string | null,
    public createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  static create(params: {
    contractId: string;
    contractID: string;
    contractNum: string;
    companyId: string;
    hcfId: string;
    startDate: Date;
    endDate: Date;
    billingType: 'Bed' | 'Kg' | 'Lumpsum';
    status?: 'Draft' | 'Active' | 'Expired';
    createdBy?: string | null;
  }): Contract {
    const now = new Date();
    return new Contract(
      params.contractId,
      params.contractID,
      params.contractNum,
      params.companyId,
      params.hcfId,
      params.startDate,
      params.endDate,
      params.billingType,
      params.status || 'Draft',
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    contractId: string;
    contractID: string;
    contractNum: string;
    companyId: string;
    hcfId: string;
    startDate: Date;
    endDate: Date;
    billingType: 'Bed' | 'Kg' | 'Lumpsum';
    status: 'Draft' | 'Active' | 'Expired';
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Contract {
    return new Contract(
      data.contractId,
      data.contractID,
      data.contractNum,
      data.companyId,
      data.hcfId,
      data.startDate,
      data.endDate,
      data.billingType,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    contractNum?: string;
    startDate?: Date;
    endDate?: Date;
    billingType?: 'Bed' | 'Kg' | 'Lumpsum';
    status?: 'Draft' | 'Active' | 'Expired';
    modifiedBy?: string | null;
  }): void {
    if (data.contractNum !== undefined) {
      (this as any).contractNum = data.contractNum;
    }
    if (data.startDate !== undefined) {
      this.startDate = data.startDate;
    }
    if (data.endDate !== undefined) {
      this.endDate = data.endDate;
    }
    if (data.billingType !== undefined) {
      this.billingType = data.billingType;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  delete(modifiedBy?: string | null): void {
    this.isDeleted = true;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }
}
