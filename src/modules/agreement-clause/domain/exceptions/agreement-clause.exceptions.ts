export class AgreementClauseNotFoundException extends Error {
  constructor(id: string) {
    super(`Agreement clause with ID ${id} not found`);
    this.name = 'AgreementClauseNotFoundException';
  }
}

export class AgreementClausePointNumExistsException extends Error {
  constructor(pointNum: string, agreementId: string) {
    super(`Point number ${pointNum} already exists for agreement ${agreementId}`);
    this.name = 'AgreementClausePointNumExistsException';
  }
}
