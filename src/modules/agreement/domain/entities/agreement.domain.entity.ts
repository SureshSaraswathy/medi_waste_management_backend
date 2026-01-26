export class Agreement {
  private constructor(
    public readonly agreementId: string,
    public readonly agreementID: string,
    public readonly agreementNum: string,
    public readonly contractId: string,
    public agreementDate: Date,
    public status: 'Draft' | 'Generated' | 'Signed',
    public createdBy: string | null,
    public createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  static create(params: {
    agreementId: string;
    agreementID: string;
    agreementNum: string;
    contractId: string;
    agreementDate: Date;
    status?: 'Draft' | 'Generated' | 'Signed';
    createdBy?: string | null;
  }): Agreement {
    const now = new Date();
    return new Agreement(
      params.agreementId,
      params.agreementID,
      params.agreementNum,
      params.contractId,
      params.agreementDate,
      params.status || 'Draft',
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    agreementId: string;
    agreementID: string;
    agreementNum: string;
    contractId: string;
    agreementDate: Date;
    status: 'Draft' | 'Generated' | 'Signed';
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Agreement {
    return new Agreement(
      data.agreementId,
      data.agreementID,
      data.agreementNum,
      data.contractId,
      data.agreementDate,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    agreementNum?: string;
    agreementDate?: Date;
    status?: 'Draft' | 'Generated' | 'Signed';
    modifiedBy?: string | null;
  }): void {
    if (data.agreementNum !== undefined) {
      (this as any).agreementNum = data.agreementNum;
    }
    if (data.agreementDate !== undefined) {
      this.agreementDate = data.agreementDate;
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
