export class AgreementClause {
  private constructor(
    public readonly clauseId: string,
    public readonly agreementClauseID: string,
    public readonly agreementId: string,
    public pointNum: string,
    public pointTitle: string,
    public pointText: string,
    public sequenceNo: number,
    public status: 'Active' | 'Inactive',
    public createdBy: string | null,
    public createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  static create(params: {
    clauseId: string;
    agreementClauseID: string;
    agreementId: string;
    pointNum: string;
    pointTitle: string;
    pointText: string;
    sequenceNo: number;
    status?: 'Active' | 'Inactive';
    createdBy?: string | null;
  }): AgreementClause {
    const now = new Date();
    return new AgreementClause(
      params.clauseId,
      params.agreementClauseID,
      params.agreementId,
      params.pointNum,
      params.pointTitle,
      params.pointText,
      params.sequenceNo,
      params.status || 'Active',
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    clauseId: string;
    agreementClauseID: string;
    agreementId: string;
    pointNum: string;
    pointTitle: string;
    pointText: string;
    sequenceNo: number;
    status: 'Active' | 'Inactive';
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): AgreementClause {
    return new AgreementClause(
      data.clauseId,
      data.agreementClauseID,
      data.agreementId,
      data.pointNum,
      data.pointTitle,
      data.pointText,
      data.sequenceNo,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    pointNum?: string;
    pointTitle?: string;
    pointText?: string;
    sequenceNo?: number;
    status?: 'Active' | 'Inactive';
    modifiedBy?: string | null;
  }): void {
    if (data.pointNum !== undefined) {
      this.pointNum = data.pointNum;
    }
    if (data.pointTitle !== undefined) {
      this.pointTitle = data.pointTitle;
    }
    if (data.pointText !== undefined) {
      this.pointText = data.pointText;
    }
    if (data.sequenceNo !== undefined) {
      this.sequenceNo = data.sequenceNo;
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
